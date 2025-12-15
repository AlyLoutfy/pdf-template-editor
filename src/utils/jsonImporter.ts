import type {
  EditorTextField,
  EditorImageField,
  EditorPaymentPlan,
  LegacyJSON,
  V2JSON,
} from '../types';
import { legacyColorToHex } from './jsonExporter';

const generateId = () => Math.random().toString(36).substring(2, 11);

export function detectJsonVersion(json: unknown): 'legacy' | 'v2' | 'unknown' {
  if (!json || typeof json !== 'object') return 'unknown';
  
  const obj = json as Record<string, unknown>;
  
  if (obj.version === 2) return 'v2';
  if (Array.isArray(obj.texts) && Array.isArray(obj.images)) return 'legacy';
  
  return 'unknown';
}

export function importLegacyJSON(json: LegacyJSON): {
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
} {
  const textFields: EditorTextField[] = [];
  
  // Group fields by chain to calculate absolute positions
  const chainGroups = new Map<string, typeof json.texts>();
  
  json.texts.forEach((field) => {
    if (field.chain !== undefined && field.order !== undefined) {
      const key = `${field.page ?? field.pageReference}-${field.chain}`;
      const group = chainGroups.get(key) || [];
      group.push(field);
      chainGroups.set(key, group);
    } else {
      // Non-chained field
      textFields.push({
        id: generateId(),
        page: field.page ?? 0,
        pageReference: field.pageReference,
        content: field.content,
        x: field.x ?? 0,
        y: field.y,
        size: field.size,
        color: field.color ? legacyColorToHex(field.color) : '#000000',
        isHorizontallyCentered: field.isHorizontallyCentered ?? false,
        isFullNumber: field.isFullNumber ?? false,
        requires: field.requires,
      });
    }
  });

  // Process chained fields
  chainGroups.forEach((fields, key) => {
    // Sort by order
    const sorted = fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    // Find the anchor field (first in chain with absolute position)
    const anchor = sorted.find((f) => f.x !== undefined && f.y !== undefined);
    if (!anchor) return;

    let currentX = anchor.x ?? 0;
    let currentY = anchor.y;

    sorted.forEach((field, index) => {
      if (index > 0) {
        currentX += field.xEffect ?? 0;
        currentY += field.yEffect ?? 0;
      }

      textFields.push({
        id: generateId(),
        page: field.page ?? 0,
        pageReference: field.pageReference,
        content: field.content,
        x: field.x ?? currentX,
        y: field.y ?? currentY,
        size: field.size,
        color: field.color ? legacyColorToHex(field.color) : '#000000',
        isHorizontallyCentered: field.isHorizontallyCentered ?? false,
        isFullNumber: field.isFullNumber ?? false,
        requires: field.requires,
        groupId: key,
        orderInGroup: field.order,
      });
    });
  });

  const imageFields: EditorImageField[] = json.images.map((img) => ({
    id: generateId(),
    type: img.content.includes('Gallery')
      ? 'gallery'
      : img.content.includes('floorPlans')
      ? 'floorPlan'
      : 'unitLocation',
    var: img.content,
    insertAfterPage: img.page ?? 0,
    pageReference: img.pageReference,
    sizing: img.isFullWidth ? 'matchWidth' : 'matchHeight',
    insertNewPages: img.insertNewpages ?? false,
  }));

  const paymentPlans: EditorPaymentPlan[] = json.paymentPlansPages.map((plan) => ({
    id: generateId(),
    insertAfterPage: 0,
    pageReference: plan.pageReference,
    selectedOnly: plan.selectedPaymentPlan ?? false,
    paymentPlanId: plan.paymentPlanId,
  }));

  return { textFields, imageFields, paymentPlans };
}

export function importV2JSON(json: V2JSON): {
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
} {
  const textFields: EditorTextField[] = [];
  const defaultFontSize = json.defaults?.fontSize ?? 20;
  const defaultColor = json.defaults?.color ?? '#000000';

  json.pages.forEach((page) => {
    const pageNum = typeof page.page === 'number' 
      ? page.page 
      : 0;
    const pageRef = typeof page.page === 'string'
      ? page.page === 'last' 
        ? '{length - 1}' 
        : `{${page.page.replace('last', 'length')}}`
      : undefined;

    page.texts?.forEach((text) => {
      const content = text.var 
        ? `{${text.var}}` 
        : text.template ?? '';

      textFields.push({
        id: text.id || generateId(),
        page: pageNum,
        pageReference: pageRef,
        content,
        x: text.x ?? 0,
        y: text.y,
        size: text.fontSize ?? defaultFontSize,
        color: text.color ?? defaultColor,
        isHorizontallyCentered: text.align === 'center',
        isFullNumber: text.format === 'number' || text.format === 'currency',
        requires: text.showIf ? `{${text.showIf}}` : undefined,
      });
    });

    // Process groups into individual text fields
    page.groups?.forEach((group) => {
      let currentY = group.startY ?? 0;

      group.items.forEach((item, index) => {
        const groupId = group.id;
        
        // Label field
        textFields.push({
          id: generateId(),
          page: pageNum,
          pageReference: pageRef,
          content: item.label,
          x: group.labelX,
          y: currentY,
          size: group.fontSize ?? defaultFontSize,
          color: group.color ?? defaultColor,
          isHorizontallyCentered: false,
          isFullNumber: false,
          requires: item.showIf ? `{${item.showIf}}` : undefined,
          groupId,
          orderInGroup: index * 2,
        });

        // Value field
        const valueContent = item.suffix 
          ? `{${item.var}}${item.suffix}` 
          : `{${item.var}}`;

        textFields.push({
          id: generateId(),
          page: pageNum,
          pageReference: pageRef,
          content: valueContent,
          x: group.valueX,
          y: currentY,
          size: group.fontSize ?? defaultFontSize,
          color: group.color ?? defaultColor,
          isHorizontallyCentered: false,
          isFullNumber: item.format === 'number' || item.format === 'currency',
          requires: item.showIf ? `{${item.showIf}}` : undefined,
          groupId,
          orderInGroup: index * 2 + 1,
        });

        currentY -= group.spacingY;
      });
    });
  });

  const imageFields: EditorImageField[] = json.images.map((img) => {
    const insertAfter = typeof img.insertAfter === 'number'
      ? img.insertAfter
      : 0;
    const pageRef = typeof img.insertAfter === 'string'
      ? `{${img.insertAfter.replace('last', 'length')}}`
      : undefined;

    return {
      id: img.id || generateId(),
      type: img.var.includes('Gallery')
        ? 'gallery'
        : img.var.includes('floorPlans')
        ? 'floorPlan'
        : 'unitLocation',
      var: `{${img.var}}`,
      insertAfterPage: insertAfter,
      pageReference: pageRef,
      sizing: img.sizing,
      insertNewPages: img.newPages ?? false,
    };
  });

  const paymentPlans: EditorPaymentPlan[] = [];
  if (json.paymentPlan) {
    const pageRef = typeof json.paymentPlan.page === 'string'
      ? `{${json.paymentPlan.page.replace('last', 'length')}}`
      : '{length}';

    paymentPlans.push({
      id: generateId(),
      insertAfterPage: 0,
      pageReference: pageRef,
      selectedOnly: json.paymentPlan.selectedOnly ?? false,
      paymentPlanId: json.paymentPlan.paymentPlanId,
    });
  }

  return { textFields, imageFields, paymentPlans };
}

export function importJSON(jsonString: string): {
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
} | null {
  try {
    const json = JSON.parse(jsonString);
    const version = detectJsonVersion(json);

    if (version === 'legacy') {
      return importLegacyJSON(json as LegacyJSON);
    } else if (version === 'v2') {
      return importV2JSON(json as V2JSON);
    }

    console.error('Unknown JSON format');
    return null;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return null;
  }
}






