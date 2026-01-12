import type {
  EditorTextField,
  EditorImageField,
  EditorPaymentPlan,
  LegacyJSON,
  LegacyTextField,
  LegacyImageField,
  LegacyPaymentPlanPage,
  V2JSON,
  V2Page,
  V2TextField,
  V2ImageField,
} from '../types';
import type { VirtualPage } from '../stores/editorStore';

// Convert hex color to RGB 0-1 format
export function hexToLegacyColor(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { red: 0, green: 0, blue: 0 };
  }
  return {
    red: Math.round((parseInt(result[1], 16) / 255) * 10000) / 10000,
    green: Math.round((parseInt(result[2], 16) / 255) * 10000) / 10000,
    blue: Math.round((parseInt(result[3], 16) / 255) * 10000) / 10000,
  };
}

// Convert RGB 0-1 to hex
export function legacyColorToHex(color: { red: number; green: number; blue: number }): string {
  const r = Math.round(color.red * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.green * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.blue * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Export to Legacy JSON format
export function exportToLegacyJSON(
  textFields: EditorTextField[],
  imageFields: EditorImageField[],
  paymentPlans: EditorPaymentPlan[],
  _numPages: number,
  virtualPages?: VirtualPage[] // Add optional for backward compatibility in calls, but required for correct PP pages
): LegacyJSON {
  /* 
   * Process text fields:
   * 1. Group fields by groupId
   * 2. Calculate chain/order/effects for grouped fields
   * 3. Handle ungrouped fields normally
   */
  const texts: LegacyTextField[] = [];
  const groups = new Map<string, EditorTextField[]>();
  const ungrouped: EditorTextField[] = [];

  // 1. Separate grouped and ungrouped fields
  textFields.forEach((field) => {
    if (field.groupId) {
      const group = groups.get(field.groupId) || [];
      group.push(field);
      groups.set(field.groupId, group);
    } else {
      ungrouped.push(field);
    }
  });

  // 2. Process groups
  let chainCounter = 1;
  groups.forEach((groupFields) => {
    // Sort by Y descending (highest Y is first/order 1)
    // Note: In PDF/Canvas coordinates, strictly speaking 0 is top. 
    // "Highest value in y axis" usually means bottom of page if origin is top-left.
    // However, usually lists go from Top to Bottom.
    // If user means "Highest Value" as in "Topmost visually", then it should be Smallest Y (if 0 is top).
    // Let's re-read: "the highest value in y axis takes the order 1".
    // If coordinates are standard PDF (0 at bottom), then highest Y is top.
    // If coordinates are Web/Canvas (0 at top), then highest Y is bottom.
    // The user's JSON example has Y=30 (top) and Y=450 (lower).
    // BUT looking at the JSON example:
    // { "page": 12, "content": "{unitId}", "x": 50, "y": 450, "size": 30 },
    // { "page": 12, "content": "Unit Type", ... "y": 370 ... order 1 }
    // { "page": 12, "content": "{unitType}", ... "y": 370 ... order 1 }
    // { "page": 12, "content": "Floor", ... yEffect: -50 ... order 2 }
    // It seems "Highest Y" means numerically larger Y?
    // Wait, in the example:
    // "Unit Type" at y=370 is order 1.
    // "Floor" is order 2. It has yEffect -50. So y = 370 - 50 = 320.
    // So "Floor" is visually "above" "Unit Type" if Y increases downwards? Or Y increases upwards?
    // In PDF, usually Y=0 is bottom-left. So Y=450 is Top. Y=30 is Bottom.
    // If Order 1 is Y=370, Order 2 is Y=320. Order 2 is *below* Order 1 in value (320 < 370).
    // So the list grows "downwards" in value (towards 0).
    // So "Highest Value in Y axis takes order 1" means strict numerical sorting descending.
    // 370 > 320.
    // So Order 1 (370) -> Order 2 (320).
    // This matches the user instruction: "highest value in y axis takes the order 1".
    
    const sorted = groupFields.sort((a, b) => {
      // 1. If both have explicit order, use it (ascending)
      if (a.orderInGroup !== undefined && b.orderInGroup !== undefined) {
        return a.orderInGroup - b.orderInGroup;
      }
      
      // 2. If only one has explicit order, it comes first? 
      // Actually, if we mix auto and manual, we should probably treat undefined as "after manual".
      if (a.orderInGroup !== undefined) return -1;
      if (b.orderInGroup !== undefined) return 1;

      // 3. Fallback to Y-axis descending (standard behavior)
      return b.y - a.y;
    });
    const currentChainId = chainCounter++;

    sorted.forEach((field, index) => {
      const isFirst = index === 0;
      const prevField = index > 0 ? sorted[index - 1] : null;

      const legacyField: LegacyTextField = {
        content: field.content,
        // Y is required in type but we made it optional. 
        // For first element, we put absolute Y.
        // For others, if we want to follow the "no Y" pattern, we omit it.
        size: field.size,
        chain: currentChainId,
        order: index + 1,
      };

      if (isFirst) {
        legacyField.y = Math.round(field.y);
        // Add X for first element (unless grouped items don't use absolute X? They probably do for anchor)
        if (!field.isHorizontallyCentered) {
          legacyField.x = Math.round(field.x);
        }
      } else {
         // Calculate effects relative to PREVIOUS element
         // xEffect = current - prev
         // yEffect = current - prev
         if (prevField) {
           legacyField.xEffect = Math.round(field.x - prevField.x);
           legacyField.yEffect = Math.round(field.y - prevField.y);
         }
      }

      // Page/Ref
      if (field.pageReference) {
        legacyField.pageReference = field.pageReference;
      } else {
        legacyField.page = field.page;
      }

      // Other props
      if (field.isHorizontallyCentered) legacyField.isHorizontallyCentered = true;
      if (field.isFullNumber) legacyField.isFullNumber = true;
      if (field.requires) legacyField.requires = field.requires;
      if (field.color && field.color !== '#000000') {
        legacyField.color = hexToLegacyColor(field.color);
      }

      texts.push(legacyField);
    });
  });

  // 3. Process ungrouped fields
  ungrouped.forEach((field) => {
    const legacyField: LegacyTextField = {
      content: field.content,
      y: Math.round(field.y),
      size: field.size,
    };

    if (field.pageReference) {
      legacyField.pageReference = field.pageReference;
    } else {
      legacyField.page = field.page;
    }

    if (!field.isHorizontallyCentered) {
      legacyField.x = Math.round(field.x);
    }

    if (field.isHorizontallyCentered) legacyField.isHorizontallyCentered = true;
    if (field.isFullNumber) legacyField.isFullNumber = true;
    if (field.requires) legacyField.requires = field.requires;
    if (field.color && field.color !== '#000000') {
      legacyField.color = hexToLegacyColor(field.color);
    }

    texts.push(legacyField);
  });

  const images: LegacyImageField[] = imageFields.map((field) => {
    const legacyImage: LegacyImageField = {
      content: field.var,
      x: 0,
      y: 0,
    };

    if (field.pageReference) {
      legacyImage.pageReference = field.pageReference;
    } else {
      legacyImage.page = field.insertAfterPage;
    }

    if (field.sizing === 'matchWidth') {
      legacyImage.isFullWidth = true;
    }

    if (field.insertNewPages) {
      legacyImage.insertNewpages = true;
    }

    legacyImage.rotation = null;

    return legacyImage;
  });

  const paymentPlansPages: LegacyPaymentPlanPage[] = paymentPlans.map((plan) => {
    const legacyPlan: LegacyPaymentPlanPage = {};

    // 1. If pageReference is explicitly set (e.g. "{length}"), use it.
    if (plan.pageReference) {
      legacyPlan.pageReference = plan.pageReference;
    } else {
      // 2. If no pageReference, calculate page number from virtualPages order
      if (virtualPages) {
         const index = virtualPages.findIndex(p => p.type === 'payment-plan' && p.planId === plan.id);
         if (index !== -1) {
            legacyPlan.page = index + 1; // 0-based index -> 1-based page number
         } else {
            // Fallback if not found (shouldn't happen if synced)
            legacyPlan.page = plan.insertAfterPage + 1; 
         }
      } else {
         // Fallback if virtualPages not passed
         legacyPlan.page = plan.insertAfterPage + 1;
      }
    }

    if (plan.selectedOnly) {
      legacyPlan.selectedPaymentPlan = true;
    }

    if (plan.paymentPlanId) {
      legacyPlan.paymentPlanId = plan.paymentPlanId;
    }

    return legacyPlan;
  });



  return {
    texts,
    images,
    paymentPlansPages,
  };
}

export function exportToV2JSON(
  textFields: EditorTextField[],
  imageFields: EditorImageField[],
  paymentPlans: EditorPaymentPlan[],
  _numPages: number
): V2JSON {
  // Group text fields by page
  const pageMap = new Map<number | string, EditorTextField[]>();
  
  textFields.forEach((field) => {
    const pageKey = field.pageReference || field.page;
    const existing = pageMap.get(pageKey) || [];
    existing.push(field);
    pageMap.set(pageKey, existing);
  });

  const pages: V2Page[] = [];
  
  pageMap.forEach((fields, pageKey) => {
    const pageTexts: V2TextField[] = fields.map((field) => {
      const v2Field: V2TextField = {
        id: field.id,
        y: Math.round(field.y),
      };

      // Determine if it's a variable or template
      const varMatch = field.content.match(/^\{(\w+)\}$/);
      if (varMatch) {
        v2Field.var = varMatch[1];
      } else {
        v2Field.template = field.content;
      }

      // Position
      if (field.isHorizontallyCentered) {
        v2Field.align = 'center';
      } else {
        v2Field.x = Math.round(field.x);
      }

      // Style
      if (field.size !== 20) {
        v2Field.fontSize = field.size;
      }

      if (field.color && field.color !== '#000000') {
        v2Field.color = field.color;
      }

      // Conditional
      if (field.requires) {
        v2Field.showIf = field.requires.replace(/[{}]/g, '');
      }

      // Format
      if (field.isFullNumber) {
        v2Field.format = 'number';
      }

      return v2Field;
    });

    // Convert page reference to V2 format
    let page: number | 'last' | string;
    if (typeof pageKey === 'string') {
      if (pageKey === '{length - 1}') {
        page = 'last';
      } else if (pageKey.includes('length')) {
        page = pageKey.replace('{', '').replace('}', '').replace('length', 'last');
      } else {
        page = pageKey;
      }
    } else {
      page = pageKey;
    }

    pages.push({
      page,
      texts: pageTexts,
    });
  });

  // Sort pages by page number
  pages.sort((a, b) => {
    if (typeof a.page === 'number' && typeof b.page === 'number') {
      return a.page - b.page;
    }
    if (typeof a.page === 'number') return -1;
    if (typeof b.page === 'number') return 1;
    return 0;
  });

  const images: V2ImageField[] = imageFields.map((field) => ({
    id: field.id,
    var: field.var.replace(/[{}]/g, ''),
    insertAfter: field.pageReference 
      ? field.pageReference.replace('{', '').replace('}', '').replace('length', 'last')
      : field.insertAfterPage,
    sizing: field.sizing,
    newPages: field.insertNewPages || undefined,
  }));

  const result: V2JSON = {
    version: 2,
    defaults: {
      fontSize: 20,
      color: '#000000',
    },
    pages,
    images,
  };

  if (paymentPlans.length > 0) {
    const plan = paymentPlans[0];
    result.paymentPlan = {
      page: plan.pageReference 
        ? plan.pageReference.replace('{', '').replace('}', '').replace('length', 'last')
        : 'last',
      selectedOnly: plan.selectedOnly,
      paymentPlanId: plan.paymentPlanId,
    };
  }

  return result;
}

export function downloadJSON(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

