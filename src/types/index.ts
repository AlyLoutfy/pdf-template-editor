// Legacy JSON Schema Types (for backwards compatibility)
import type { VirtualPage } from '../stores/editorStore';

export interface LegacyColor {
  red: number;
  green: number;
  blue: number;
}

export interface LegacyTextField {
  page?: number;
  pageReference?: string;
  content: string;
  x?: number;
  y: number;
  size: number;
  color?: LegacyColor;
  isHorizontallyCentered?: boolean;
  isFullNumber?: boolean;
  requires?: string;
  chain?: number;
  order?: number;
  xEffect?: number;
  yEffect?: number;
}

export interface LegacyImageField {
  page?: number;
  pageReference?: string;
  content: string;
  x: number;
  y: number;
  isFullWidth?: boolean;
  insertNewpages?: boolean;
  rotation?: number | null;
  leftMarginRatio?: number;
  rightMarginRatio?: number;
}

export interface LegacyPaymentPlanPage {
  pageReference: string;
  selectedPaymentPlan?: boolean;
  paymentPlanId?: string;
}

export interface LegacyJSON {
  texts: LegacyTextField[];
  images: LegacyImageField[];
  paymentPlansPages: LegacyPaymentPlanPage[];
}

// V2 JSON Schema Types (new improved format)
export interface V2GroupItem {
  label: string;
  var: string;
  suffix?: string;
  format?: 'number' | 'currency';
  showIf?: string;
}

export interface V2Group {
  id: string;
  startX?: number;
  startY?: number;
  labelX: number;
  valueX: number;
  spacingY: number;
  fontSize?: number;
  color?: string;
  items: V2GroupItem[];
}

export interface V2TextField {
  id: string;
  var?: string;
  template?: string;
  x?: number;
  y: number;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  color?: string;
  showIf?: string;
  format?: 'number' | 'currency';
}

export interface V2Page {
  page: number | 'last' | string;
  texts?: V2TextField[];
  groups?: V2Group[];
}

export interface V2ImageField {
  id: string;
  var: string;
  insertAfter: number | string;
  sizing: 'matchWidth' | 'matchHeight';
  newPages?: boolean;
}

export interface V2PaymentPlan {
  page: number | 'last' | string;
  selectedOnly?: boolean;
  paymentPlanId?: string;
}

export interface V2JSON {
  version: 2;
  defaults?: {
    fontSize?: number;
    color?: string;
  };
  pages: V2Page[];
  images: V2ImageField[];
  paymentPlan?: V2PaymentPlan;
}

// Editor Internal Types
export interface EditorTextField {
  id: string;
  page: number;
  pageReference?: string;
  content: string;
  x: number;
  y: number;
  size: number;
  color: string; // hex color
  isHorizontallyCentered: boolean;
  isFullNumber: boolean;
  requires?: string;
  // For groups/chains
  groupId?: string;
  orderInGroup?: number;
  width?: number;
  height?: number;
}

export interface EditorImageField {
  id: string;
  type: 'gallery' | 'floorPlan' | 'unitLocation';
  var: string;
  insertAfterPage: number;
  pageReference?: string;
  sizing: 'matchWidth' | 'matchHeight';
  insertNewPages: boolean;
}

export interface EditorPaymentPlan {
  id: string;
  insertAfterPage: number;
  pageReference?: string;
  selectedOnly: boolean;
  paymentPlanId?: string;
}

export interface EditorState {
  // PDF
  pdfFile: File | null;
  pdfUrl: string | null;
  numPages: number;
  currentPage: number;
  zoom: number;
  
  // Fields
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
  
  // Selection
  selectedFieldIds: string[];
  
  // UI State
  activeTool: 'select' | 'text' | 'image';
  jsonTab: 'legacy' | 'v2';
  showJsonPanel: boolean;
  showPresets: boolean; // New
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
}

export interface HistoryEntry {
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
  virtualPages: VirtualPage[];
  timestamp: number;
}

// Variable definitions for the dropdown
export interface VariableDefinition {
  name: string;
  var: string;
  category: 'unit' | 'user' | 'offer' | 'payment' | 'image';
  suffix?: string;
}

export const AVAILABLE_VARIABLES: VariableDefinition[] = [
  // Unit Variables
  { name: 'Unit ID', var: '{unitId}', category: 'unit' },
  { name: 'Unit Type', var: '{unitType}', category: 'unit' },
  { name: 'Floor', var: '{floor}', category: 'unit' },
  { name: 'Bedrooms', var: '{beds}', category: 'unit' },
  { name: 'BUA', var: '{bua}', category: 'unit', suffix: ' sqm' },
  { name: 'Land Area', var: '{landArea}', category: 'unit', suffix: ' sqm' },
  { name: 'Garden Area', var: '{gardenArea}', category: 'unit', suffix: ' sqm' },
  { name: 'Covered Terrace', var: '{coveredTerrace}', category: 'unit', suffix: ' sqm' },
  { name: 'Uncovered Terrace', var: '{uncoveredTerrace}', category: 'unit', suffix: ' sqm' },
  { name: 'Finishing', var: '{finishing}', category: 'unit' },
  { name: 'Price', var: '{price}', category: 'unit' },
  
  // User/Agent Variables
  { name: 'Agent Name', var: '{userName}', category: 'user' },
  { name: 'Agent Title', var: '{userTitle}', category: 'user' },
  { name: 'Agent Phone', var: '{userPhone}', category: 'user' },
  { name: 'Agent Email', var: '{userEmail}', category: 'user' },
  
  // Offer Variables
  { name: 'Issuance Date', var: '{issuanceDate}', category: 'offer' },
  { name: 'Payment Plan Name', var: '{paymentPlanName}', category: 'offer' },
  
  // Payment Variables
  { name: 'Cash Total', var: '{payCashTotal}', category: 'payment' },
  { name: 'Cash Discount', var: '{payCashDiscount}', category: 'payment' },
  
  // Image Variables
  { name: 'Offer Gallery', var: '{offerGallery}', category: 'image' },
  { name: 'Unit Location', var: '{unitLocationImage}', category: 'image' },
  { name: 'Floor Plans', var: '{floorPlansImagesUrl}', category: 'image' },
];

// Dummy data for preview
export const DUMMY_DATA: Record<string, string> = {
  '{unitId}': 'A-101',
  '{unitType}': '2 Bedroom Apartment',
  '{floor}': '3',
  '{beds}': '2',
  '{bua}': '125',
  '{landArea}': '200',
  '{gardenArea}': '50',
  '{coveredTerrace}': '15',
  '{uncoveredTerrace}': '25',
  '{finishing}': 'Fully Finished',
  '{price}': '3,500,000',
  '{userName}': 'John Smith',
  '{userTitle}': 'Senior Sales Consultant',
  '{userPhone}': '+20 123 456 7890',
  '{userEmail}': 'john.smith@company.com',
  '{issuanceDate}': 'December 7, 2025',
  '{paymentPlanName}': '10% Down Payment Plan',
  '{payCashTotal}': '3,150,000',
  '{payCashDiscount}': '350,000',
};

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
}




export interface Preset {
  id: string;
  name: string;
  fields: EditorTextField[]; // Relative positions from top-left of the group
}

export interface EditorState {
  // ... existing ...
  presets: Preset[];
  showPresets: boolean;
}



