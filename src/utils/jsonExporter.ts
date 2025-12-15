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
  _numPages: number
): LegacyJSON {
  const texts: LegacyTextField[] = textFields.map((field) => {
    const legacyField: LegacyTextField = {
      content: field.content,
      y: Math.round(field.y),
      size: field.size,
    };

    // Page reference
    if (field.pageReference) {
      legacyField.pageReference = field.pageReference;
    } else {
      legacyField.page = field.page;
    }

    // X coordinate (only if not horizontally centered)
    if (!field.isHorizontallyCentered) {
      legacyField.x = Math.round(field.x);
    }

    // Optional fields
    if (field.isHorizontallyCentered) {
      legacyField.isHorizontallyCentered = true;
    }

    if (field.isFullNumber) {
      legacyField.isFullNumber = true;
    }

    if (field.requires) {
      legacyField.requires = field.requires;
    }

    // Color (only if not default black)
    if (field.color && field.color !== '#000000') {
      legacyField.color = hexToLegacyColor(field.color);
    }

    return legacyField;
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
    const legacyPlan: LegacyPaymentPlanPage = {
      pageReference: plan.pageReference || `{length}`,
    };

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

