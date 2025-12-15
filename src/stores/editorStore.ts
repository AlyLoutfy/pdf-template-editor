import { create } from 'zustand';
import type {
  EditorTextField,
  EditorImageField,
  EditorPaymentPlan,
  HistoryEntry,
  Guide,
  Preset,
} from '../types';
import { useToast } from '../components/Toast';
import { generateId } from '../utils';

/** Virtual page can be a PDF page or an image placeholder */
export type VirtualPage = 
  | { type: 'pdf'; pageNum: number }
  | { type: 'image'; imageId: string }
  | { type: 'payment-plan'; planId: string };

export type { VirtualPage as VirtualPageType };

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'cover-page',
    name: 'Cover Page Info',
    fields: [
      { id: 'p1', content: 'Ref: {unitId}', x: 50, y: 700, size: 14, color: '#ffffff', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'p2', content: 'Date: {issuanceDate}', x: 50, y: 680, size: 14, color: '#ffffff', isHorizontallyCentered: false, isFullNumber: false, page: 0 }
    ] as EditorTextField[]
  },
  {
    id: 'unit-details',
    name: 'Unit Details',
    fields: [
      { id: 'ud1', content: 'Unit: {unitId}', x: 50, y: 600, size: 12, color: '#000000', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'ud2', content: 'Type: {unitType}', x: 50, y: 580, size: 12, color: '#000000', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'ud3', content: 'Beds: {beds}', x: 200, y: 600, size: 12, color: '#000000', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'ud4', content: 'BUA: {bua} sqm', x: 200, y: 580, size: 12, color: '#000000', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
    ] as EditorTextField[]
  },
  {
    id: 'sales-contact',
    name: 'Sales Info',
    fields: [
      { id: 'sc1', content: '{userName}', x: 50, y: 150, size: 16, color: '#000000', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'sc2', content: '{userTitle}', x: 50, y: 130, size: 12, color: '#666666', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'sc3', content: '{userPhone}', x: 50, y: 110, size: 12, color: '#666666', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
      { id: 'sc4', content: '{userEmail}', x: 50, y: 90, size: 12, color: '#666666', isHorizontallyCentered: false, isFullNumber: false, page: 0 },
    ] as EditorTextField[]
  }
];


interface EditorStore {
  // Theme
  currentTheme: 'default' | 'slate-amber' | 'gray-blue' | 'stone-rose' | 'zinc-violet' | 'neutral-red' | 'light' | 'light-warm' | 'light-cool' | 'dark' | 'midnight' | 'forest';
  setTheme: (theme: 'default' | 'slate-amber' | 'gray-blue' | 'stone-rose' | 'zinc-violet' | 'neutral-red' | 'light' | 'light-warm' | 'light-cool' | 'dark' | 'midnight' | 'forest') => void;

  // PDF State
  pdfFile: File | null;
  pdfUrl: string | null;
  numPages: number;
  currentPage: number; // 1-indexed PDF page
  currentVirtualPageIndex: number; // Index in the virtual pages array
  zoom: number;
  pdfDimensions: { width: number; height: number } | null;

  // Hydration & Persistence
  hydrateTemplate: (templateId: string, templateData: any, pdfBlob?: Blob) => void;
  getSnapshot: () => any;
  saveProject: (templateId: string) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'success';

  // Fields
  textFields: EditorTextField[];
  imageFields: EditorImageField[];
  paymentPlans: EditorPaymentPlan[];
  virtualPages: VirtualPage[];
  guides: Guide[];
  presets: Preset[];

  // Selection
  selectedFieldIds: string[];

  // Clipboard for copy/paste styles
  copiedStyles: {
    size: number;
    color: string;
    isHorizontallyCentered: boolean;
    isFullNumber: boolean;
  } | null;

  // UI State
  activeTool: 'select' | 'text' | 'image' | 'hand';
  jsonTab: 'legacy' | 'v2';
  showJsonPanel: boolean;
  showVariables: boolean;
  showShortcuts: boolean;
  showAddMenu: boolean;
  showPresets: boolean;
  snapEnabled: boolean;
  viewMode: 'scroll' | 'page' | 'grid';
  rightPanelWidth: number; 
  jsonPanelHeight: number;

  setRightPanelWidth: (w: number) => void;
  setJsonPanelHeight: (h: number) => void;
  setShowVariables: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowAddMenu: (show: boolean) => void;
  setShowPresets: (show: boolean) => void;
  setShowJsonPanel: (show: boolean) => void;
  setActiveTool: (tool: 'select' | 'text' | 'image' | 'hand') => void; 
  setSnapEnabled: (enabled: boolean) => void;
  setViewMode: (mode: 'scroll' | 'page' | 'grid') => void;
  setJsonTab: (tab: 'legacy' | 'v2') => void;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  // PDF Actions
  setPdfFile: (file: File | null) => void;
  setNumPages: (num: number) => void;
  setCurrentPage: (page: number) => void;
  setCurrentVirtualPageIndex: (index: number) => void;
  setZoom: (zoom: number) => void;
  setPdfDimensions: (dimensions: { width: number; height: number } | null) => void;
  getVirtualPages: () => VirtualPage[];
  getCurrentVirtualPage: () => VirtualPage | null;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setVirtualPages: (pages: VirtualPage[]) => void;
  deletePage: (index: number) => void;
  duplicatePage: (index: number) => void;

  // Field Actions
  addTextField: (field: EditorTextField) => void;
  updateTextField: (id: string, updates: Partial<EditorTextField>) => void;
  deleteTextField: (id: string) => void;
  setTextFields: (fields: EditorTextField[]) => void;

  addImageField: (field: EditorImageField) => void;
  updateImageField: (id: string, updates: Partial<EditorImageField>) => void;
  deleteImageField: (id: string) => void;
  setImageFields: (fields: EditorImageField[]) => void;

  addPaymentPlan: (plan: EditorPaymentPlan) => void;
  updatePaymentPlan: (id: string, updates: Partial<EditorPaymentPlan>) => void;
  deletePaymentPlan: (id: string) => void;
  setPaymentPlans: (plans: EditorPaymentPlan[]) => void;

  clearAll: () => void;

  // Guide Actions
  addGuide: (guide: Guide) => void;
  updateGuide: (id: string, position: number) => void;
  deleteGuide: (id: string) => void;
  clearGuides: () => void;

  // Presets
  addPreset: (preset: Preset) => void;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (presetId: string, pageIndex?: number) => void;

  // Selection Actions
  selectField: (id: string, addToSelection?: boolean) => void;
  selectFields: (ids: string[]) => void;
  clearSelection: () => void;
  selectAllOnPage: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copyStyles: (field?: EditorTextField) => void;
  pasteStyles: () => void;
  moveSelected: (dx: number, dy: number) => void;

  // Alignment
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;
  
  // Internal Helpers
  _getSelectedFields: () => (EditorTextField | EditorImageField | EditorPaymentPlan)[];
  _getFieldDimensions: (field: any) => { width: number; height: number; x: number; y: number };
  _updateFields: (updates: Map<string, {x?: number, y?: number}>) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Theme
  currentTheme: 'default',
  setTheme: (theme) => set({ currentTheme: theme }),
  saveStatus: 'idle',
  saveProject: async (templateId: string) => {
      set({ saveStatus: 'saving' });
      const state = get();
      
      try {
        const { getSnapshot, pdfFile, textFields, imageFields } = state;
        const snapshot = getSnapshot();

        // 1. Save editor state to IndexedDB
        // We do dynamic import here to keep store initialization fast
        const idb = await import('idb-keyval');
        await idb.set(`template-${templateId}`, snapshot);
        
        // 2. Save PDF file (if it exists)
        if (pdfFile) {
            // We import saveFile from utils. 
            // NOTE: The store file needs to import 'saveFile' at the top if not present,
            // or we do dynamic import if we want to avoid circular deps. 
            // We'll trust the static import at the top for now.
            const { saveFile } = await import('../utils/storage');
            await saveFile(templateId, pdfFile);
        }

        // 3. Update Project Metadata (element count)
        // Access Project Store directly
        const { useProjectStore } = await import('./projectStore');
        const elementCount = textFields.length + imageFields.length;
        useProjectStore.getState().updateTemplate(templateId, { elementCount });

        set({ saveStatus: 'success' });
        useToast.getState().show("Changes saved successfully", "success");
        setTimeout(() => set({ saveStatus: 'idle' }), 2000);
      } catch (err) {
        console.error("Save failed", err);
        set({ saveStatus: 'idle' });
        useToast.getState().show("Failed to save changes", "error");
      }
  },

  // PDF State
  pdfFile: null,
  pdfUrl: null,
  numPages: 0,
  currentPage: 1,
  currentVirtualPageIndex: 0,
  zoom: 1,
  pdfDimensions: null,

  // Fields
  textFields: [],
  imageFields: [],
  paymentPlans: [],
  virtualPages: [],
  guides: [],
  presets: DEFAULT_PRESETS,

  // Selection
  selectedFieldIds: [],

  // Clipboard
  copiedStyles: null,

  // UI State
  activeTool: 'select',
  jsonTab: 'legacy',
  showJsonPanel: false,
  showVariables: false,
  showShortcuts: false,
  showAddMenu: false,
  showPresets: false,
  snapEnabled: true,
  viewMode: 'scroll',
  rightPanelWidth: 320,
  jsonPanelHeight: 300,

  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  setJsonPanelHeight: (height) => set({ jsonPanelHeight: height }),
  setShowVariables: (show) => set({ showVariables: show }),
  setShowShortcuts: (show) => set({ showShortcuts: show }),
  setShowAddMenu: (show) => set({ showAddMenu: show }),
  setShowPresets: (show) => set({ showPresets: show }),
  setShowJsonPanel: (show) => set({ showJsonPanel: show }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setJsonTab: (tab) => set({ jsonTab: tab }),

  // History
  history: [],
  historyIndex: -1,

  saveToHistory: () => {
      const state = get();
      const entry: HistoryEntry = {
          textFields: state.textFields,
          imageFields: state.imageFields,
          paymentPlans: state.paymentPlans,
          virtualPages: state.virtualPages,
          timestamp: Date.now()
      };
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(entry);
      
      // Limit history
      if (newHistory.length > 50) newHistory.shift();
      
      set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
          saveStatus: 'idle'
      });
  },

  undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
          const prevEntry = history[historyIndex - 1];
          set({
              textFields: prevEntry.textFields,
              imageFields: prevEntry.imageFields,
              paymentPlans: prevEntry.paymentPlans,
              virtualPages: prevEntry.virtualPages,
              historyIndex: historyIndex - 1
          });
      }
  },

  redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
          const nextEntry = history[historyIndex + 1];
           set({
              textFields: nextEntry.textFields,
              imageFields: nextEntry.imageFields,
              paymentPlans: nextEntry.paymentPlans,
              virtualPages: nextEntry.virtualPages,
              historyIndex: historyIndex + 1
          });
      }
  },

  // Hydration
  hydrateTemplate: (_templateId, data, pdfBlob) => {
      // Revoke old
      const currentUrl = get().pdfUrl;
      if (currentUrl) URL.revokeObjectURL(currentUrl);

      const newUrl = pdfBlob ? URL.createObjectURL(pdfBlob) : null;
      
      set({
          textFields: data.textFields || [],
          imageFields: data.imageFields || [],
          paymentPlans: data.paymentPlans || [],
          virtualPages: data.virtualPages || [],
          guides: data.guides || [],
          presets: data.presets || DEFAULT_PRESETS,
          // If no virtual pages in data, and we have pdf, we might need to rely on setNumPages later or ensure strict order.
          // PDF file object:
          pdfFile: pdfBlob ? new File([pdfBlob], "template.pdf", { type: 'application/pdf' }) : null,
          pdfUrl: newUrl,
          numPages: data.numPages || 0,
          
          // Reset UI
          selectedFieldIds: [],
          history: [],
          historyIndex: -1,
          activeTool: 'select',
          saveStatus: 'success', // Treat loaded state as clean/saved
      });
  },

  getSnapshot: () => {
      const state = get();
      return {
          textFields: state.textFields,
          imageFields: state.imageFields,
          paymentPlans: state.paymentPlans,
          virtualPages: state.virtualPages,
          guides: state.guides,
          presets: state.presets,
          numPages: state.numPages,
      };
  },

  // PDF Actions
  setPdfFile: (file) => {
      const currentUrl = get().pdfUrl;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      
      const newUrl = file ? URL.createObjectURL(file) : null;
      
      set({
          pdfFile: file,
          pdfUrl: newUrl,
          // Resetting everything on new PDF main upload
          numPages: 0,
          textFields: [],
          imageFields: [],
          paymentPlans: [],
          virtualPages: [],
          currentPage: 1,
          currentVirtualPageIndex: 0
      });
      if (file) {
          useToast.getState().show("PDF template uploaded", "success");
      }
  },

  setNumPages: (num) => {
      set((state) => {
          if (state.virtualPages.length > 0) return { numPages: num }; // Don't overwrite if we have virtual pages (loading)
          
          // Init virtual pages
          const pdfPages: VirtualPage[] = Array.from({ length: num }, (_, i) => ({ type: 'pdf', pageNum: i + 1 }));
          return { numPages: num, virtualPages: pdfPages };
      });
  },
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setCurrentVirtualPageIndex: (index) => {
      const pages = get().virtualPages;
      if (index >= 0 && index < pages.length) {
          const page = pages[index];
          set({ 
              currentVirtualPageIndex: index,
              currentPage: page.type === 'pdf' ? page.pageNum : get().currentPage
          });
      }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  setPdfDimensions: (dim) => set({ pdfDimensions: dim }),
  
  getVirtualPages: () => get().virtualPages,
  getCurrentVirtualPage: () => get().virtualPages[get().currentVirtualPageIndex] || null,

  reorderPages: (from, to) => {
      get().saveToHistory();
      set((state) => {
          const newPages = [...state.virtualPages];
          const [moved] = newPages.splice(from, 1);
          newPages.splice(to, 0, moved);
          return { virtualPages: newPages };
      });
  },

  setVirtualPages: (pages) => {
      get().saveToHistory();
      set({ virtualPages: pages });
  },

  deletePage: (index) => {
      get().saveToHistory();
      const state = get();
      const page = state.virtualPages[index];
      
      const newVirtualPages = [...state.virtualPages];
      newVirtualPages.splice(index, 1);
      
      // Cleanup images on that page if it was an image page
      let newImageFields = state.imageFields;
      if (page.type === 'image') {
          newImageFields = newImageFields.filter(img => img.id !== page.imageId);
      }

      // Remove fields on this page, shift others
      const processFields = (fields: any[]) => {
          return fields
            .filter(f => f.page !== index) // Remove
            .map(f => f.page > index ? { ...f, page: f.page - 1 } : f); // Shift decrement
      };
      
      set({ 
          virtualPages: newVirtualPages, 
          imageFields: newImageFields,
          textFields: processFields(state.textFields),
          paymentPlans: processFields(state.paymentPlans)
      });
      useToast.getState().show("Page deleted", "success");
  },

  duplicatePage: (index) => {
     get().saveToHistory();
     const state = get();
     const pageToDup = state.virtualPages[index];
     
     if (!pageToDup) return;
     
     // 1. Prepare new Virtual Page
     let newVirtualPage = { ...pageToDup };
     let newImageFields = [...state.imageFields];

     if (pageToDup.type === 'image') {
         const sourceImg = state.imageFields.find(i => i.id === pageToDup.imageId);
         if (sourceImg) {
             const newImgId = generateId();
             const newImg = { ...sourceImg, id: newImgId };
             newImageFields.push(newImg);
             newVirtualPage = { type: 'image', imageId: newImgId };
         }
     }
     
     // 2. Insert Virtual Page
     const newVirtualPages = [...state.virtualPages];
     newVirtualPages.splice(index + 1, 0, newVirtualPage);

     // 3. Shift & Clone Page Elements (Text, PaymentPlans, etc)
     const processFields = (fields: any[]) => {
         const next: any[] = [];
         fields.forEach(f => {
             // Shift existing: fields on pages after the inserted one must be incremented
             if (f.page > index) {
                 next.push({ ...f, page: f.page + 1 });
             } else {
                 next.push(f);
             }
             
             // Clone target: fields on the duplicated page
             if (f.page === index) {
                 next.push({
                     ...f,
                     id: generateId(),
                     page: index + 1
                 });
             }
         });
         return next;
     };

     set({
         virtualPages: newVirtualPages,
         imageFields: newImageFields,
         textFields: processFields(state.textFields),
         paymentPlans: processFields(state.paymentPlans)
     });
     
     useToast.getState().show('Page Duplicated', 'success');
  },

  // Field Actions
  addTextField: (field) => {
      get().saveToHistory();
      set((state) => ({ textFields: [...state.textFields, { ...field, id: field.id || generateId() }] }));
  },
  updateTextField: (id, updates) => set((state) => ({ textFields: state.textFields.map(f => f.id === id ? { ...f, ...updates } : f) })),
  deleteTextField: (id) => {
      get().saveToHistory();
      set((state) => ({ textFields: state.textFields.filter(f => f.id !== id), selectedFieldIds: state.selectedFieldIds.filter(sid => sid !== id) }));
  },
  setTextFields: (fields) => set({ textFields: fields }),

  addImageField: (field) => {
      get().saveToHistory();
      set((state) => {
          const newImage = { ...field, id: field.id || generateId() };
          let newVirtualPages = [...state.virtualPages];
          let newTextFields = [...state.textFields];
          let newPaymentPlans = [...state.paymentPlans];
          let newImageFields = [...state.imageFields];

          // If insertNewPages is true, we need to insert a virtual page
          if (newImage.insertNewPages) {
              const insertIndex = field.insertAfterPage + 1; // Insert AFTER this page
              
              // 1. Insert the Virtual Page
              const newPage: VirtualPage = { type: 'image', imageId: newImage.id };
              newVirtualPages.splice(insertIndex, 0, newPage);
              
              // 2. Shift existing fields that are on or after this new page
              // Note: fields store 'page' index. If we insert at index X, all fields with page >= X should be incremented.
              const shiftFields = (fields: any[]) => fields.map(f => ({
                  ...f,
                  page: f.page >= insertIndex ? f.page + 1 : f.page
              }));
              
              newTextFields = shiftFields(newTextFields);
              // Image fields typically reference the page by ID if virtual, or page index if overlay.
              // For virtual pages (gallery etc), they are linked by ID to the page, so page index might not matter as much 
              // UNLESS they are overlaying a PDF page. 
              // But 'EditorImageField' doesn't strictly have a 'page' index property in the interface shown in types/index.ts?
              // Wait, let's check EditorTextField - it has 'page'.
              // EditorPaymentPlan has insertAfterPage/pageReference but not direct 'page' index in interface? 
              // Check EditorImageField interface in types/index.ts...
              // It has insertAfterPage.
              
              // However, legacy text fields definitely utilize 'page' index.
              newPaymentPlans = shiftFields(newPaymentPlans); // If they store 'page' index?
          }

          newImageFields.push(newImage);
          
          useToast.getState().show("Image element added", "success");
          return { 
              imageFields: newImageFields,
              virtualPages: newVirtualPages,
              textFields: newTextFields,
              paymentPlans: newPaymentPlans
          };
      });
  },
  updateImageField: (id, updates) => set((state) => ({ imageFields: state.imageFields.map(f => f.id === id ? { ...f, ...updates } : f) })),
  deleteImageField: (id) => {
      get().saveToHistory();
       set((state) => ({ imageFields: state.imageFields.filter(f => f.id !== id), selectedFieldIds: state.selectedFieldIds.filter(sid => sid !== id) }));
  },
  setImageFields: (fields) => set({ imageFields: fields }),

  addPaymentPlan: (plan) => {
      get().saveToHistory();
      set((state) => {
          const newPlan = { ...plan, id: plan.id || generateId() };
          let newVirtualPlans = [...state.paymentPlans];
          let newVirtualPages = [...state.virtualPages];
          let newTextFields = [...state.textFields];
          
          // Payment Plans often imply a new page insertion for the table
          // Check if we are inserting a new page (SmartAddMenu uses 'insert' mode)
          // The current logic in SmartAddMenu passes insertAfterPage.
          // If insertAfterPage is >= 0, we treat it as an insertion point.
          
          if (plan.insertAfterPage >= 0) {
               const insertIndex = plan.insertAfterPage + 1;
               
               // 1. Insert Virtual Page
               const newPage: VirtualPage = { type: 'payment-plan', planId: newPlan.id };
               newVirtualPages.splice(insertIndex, 0, newPage);
               
               // 2. Shift text fields
               newTextFields = newTextFields.map(f => ({
                  ...f,
                  page: f.page >= insertIndex ? f.page + 1 : f.page
               }));
               
               // Shift other payment plans?
               // Assuming explicit page index isn't stored on PaymentPlan but derived from VirtualPage order?
               // Wait, EditorTextField has 'page'. EditorPaymentPlan has 'insertAfterPage'.
               // We don't need to shift 'insertAfterPage' property of other plans necessarily, 
               // unless that property is used for "Static" placement.
               // But for virtual pages, the source of truth is the virtualPages array.
          }
          
          newVirtualPlans.push(newPlan);
          
          useToast.getState().show("Payment Plan added", "success");
          return {
              paymentPlans: newVirtualPlans,
              virtualPages: newVirtualPages,
              textFields: newTextFields
          };
      });
  },
  updatePaymentPlan: (id, updates) => set((state) => ({ paymentPlans: state.paymentPlans.map(p => p.id === id ? { ...p, ...updates } : p) })),
  deletePaymentPlan: (id) => {
      get().saveToHistory();
      set((state) => ({ paymentPlans: state.paymentPlans.filter(p => p.id !== id) }));
  },
  setPaymentPlans: (plans) => set({ paymentPlans: plans }),
  
  clearAll: () => {
      get().saveToHistory();
      set({ textFields: [], imageFields: [], paymentPlans: [], virtualPages: [], selectedFieldIds: [] });
  },

  // Guide Actions
  addGuide: (guide) => set((state) => ({ guides: [...state.guides, guide] })),
  updateGuide: (id, pos) => set((state) => ({ guides: state.guides.map(g => g.id === id ? { ...g, position: pos } : g) })),
  deleteGuide: (id) => set((state) => ({ guides: state.guides.filter(g => g.id !== id) })),
  clearGuides: () => set({ guides: [] }),

  // Presets
  addPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
  updatePreset: (id, updates) => set((state) => ({ presets: state.presets.map(p => p.id === id ? { ...p, ...updates } : p) })),
  deletePreset: (id) => set((state) => ({ presets: state.presets.filter(p => p.id !== id) })),
  applyPreset: (presetId, pageIndex = 0) => {
      get().saveToHistory();
      const preset = get().presets.find(p => p.id === presetId);
      if (!preset) return;
      
      const newFields = preset.fields.map(f => ({
          ...f,
          id: generateId(), // Always generate new ID
          page: pageIndex // Set to target page
      }));
      
      set(state => ({
          textFields: [...state.textFields, ...newFields],
          // optionally select the new fields?
          selectedFieldIds: newFields.map(f => f.id)
      }));
      
      useToast.getState().show(`Applied preset: ${preset.name}`, 'success');
  },

  // Selection
  selectField: (id, addTo) => set((state) => ({
      selectedFieldIds: addTo 
          ? state.selectedFieldIds.includes(id) ? state.selectedFieldIds.filter(sid => sid !== id) : [...state.selectedFieldIds, id]
          : [id]
  })),
  selectFields: (ids) => set({ selectedFieldIds: ids }),
  clearSelection: () => set({ selectedFieldIds: [] }),
  selectAllOnPage: () => {
      const state = get();
      // Simple implementation: all text fields on current virtual page
      const pageIndex = state.currentVirtualPageIndex;
      const ids = state.textFields.filter(f => f.page === pageIndex).map(f => f.id);
      set({ selectedFieldIds: ids });
  },
  deleteSelected: () => {
      const state = get();
      if (state.selectedFieldIds.length === 0) return;
      state.saveToHistory();
      
      set({
          textFields: state.textFields.filter(f => !state.selectedFieldIds.includes(f.id)),
          imageFields: state.imageFields.filter(f => !state.selectedFieldIds.includes(f.id)),
          selectedFieldIds: []
      });
      useToast.getState().show('Deleted selection', 'success');
  },
  duplicateSelected: () => {
      const state = get();
      if (state.selectedFieldIds.length === 0) return;
      state.saveToHistory();
      
      const newFields: EditorTextField[] = [];
      const newIds: string[] = [];
      
      state.textFields.forEach(f => {
          if (state.selectedFieldIds.includes(f.id)) {
              const newId = generateId();
              newFields.push({ ...f, id: newId, x: f.x + 20, y: f.y + 20 });
              newIds.push(newId);
          }
      });
      
      if (newFields.length > 0) {
          set({ textFields: [...state.textFields, ...newFields], selectedFieldIds: newIds });
          useToast.getState().show('Duplicated selection', 'success');
      }
  },
  copyStyles: (field) => {
      const state = get();
      const source = field || state.textFields.find(f => f.id === state.selectedFieldIds[0]);
      if (source) {
          set({ copiedStyles: { size: source.size, color: source.color, isHorizontallyCentered: !!source.isHorizontallyCentered, isFullNumber: !!source.isFullNumber } });
          useToast.getState().show('Styles copied', 'success');
      }
  },
  pasteStyles: () => {
      const state = get();
      if (!state.copiedStyles || state.selectedFieldIds.length === 0) return;
      state.saveToHistory();
      
      set({
          textFields: state.textFields.map(f => {
              if (state.selectedFieldIds.includes(f.id)) {
                  return { ...f, ...state.copiedStyles! };
              }
              return f;
          })
      });
      useToast.getState().show('Styles pasted', 'success');
  },
  moveSelected: (dx, dy) => {
      const state = get();
      if (state.selectedFieldIds.length === 0) return;
      // No history for move to avoid spam, or debounce it (not implemented here)
      set({
          textFields: state.textFields.map(f => {
              if (state.selectedFieldIds.includes(f.id)) {
                  return { ...f, x: f.x + dx, y: f.y + dy };
              }
              return f;
          })
      });
  },

  // Alignment
  // Alignment Helpers
  _getSelectedFields: () => {
      const state = get();
      const all: (EditorTextField | EditorImageField | EditorPaymentPlan)[] = [
          ...state.textFields,
          ...state.imageFields,
          ...state.paymentPlans
      ];
      return all.filter(f => state.selectedFieldIds.includes(f.id));
  },
  
  // Helper to get dimensions (width/height) for any field type
  _getFieldDimensions: (field: any) => {
      if (field.type === 'text' || !field.type) { // Text field (or legacy)
          // If we have actual measurements from the DOM (stored via TextField component), use them.
          if (field.width && field.height) {
              return {
                  width: field.width,
                  height: field.height,
                  x: field.x,
                  y: field.y
              };
          }

          // Fallback: Estimate text width: avg char width approx 0.6 * fontSize
          const content = field.content || '';
          const size = field.size || 12;
          const estimatedWidth = content.length * size * 0.6;
          return { 
              width: estimatedWidth, 
              height: size, // Approx line height
              x: field.x,
              y: field.y
          };
      } else if (field.type === 'image') {
          return {
              width: field.width || 0,
              height: field.height || 0,
              x: field.x,
              y: field.y
          };
      } else if (field.type === 'payment-plan') {
         // Payment plans usually take substantial width, maybe full width?
         // For alignment, let's assume they have a stored width or default to say 400
         return {
             width: field.width || 400, 
             height: field.height || 200,
             x: field.x,
             y: field.y
         };
      }
      return { width: 0, height: 0, x: field.x, y: field.y };
  },

  _updateFields: (updates: Map<string, {x?: number, y?: number}>) => {
      set((state) => ({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
          imageFields: state.imageFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
          paymentPlans: state.paymentPlans.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      }));
  },

  // Alignment
  // Alignment
  alignLeft: () => {
      const state = get();
      // Only text fields have x/y for now
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      
      if (selected.length < 2) return;
      state.saveToHistory();
      
      const minX = Math.min(...selected.map(f => f.x));
      const updates = new Map();
      selected.forEach(f => updates.set(f.id, { x: minX }));
      
      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  alignCenter: () => {
      const state = get();
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      if (selected.length < 2) return;
      state.saveToHistory();
      
      // Calculate average Center X using dimensions
      const centers = selected.map(f => {
          const dims = state._getFieldDimensions(f);
          return dims.x + (dims.width / 2);
      });
      const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
      
      const updates = new Map();
      selected.forEach(f => {
          const dims = state._getFieldDimensions(f);
          updates.set(f.id, { x: avgCenter - (dims.width / 2) });
      });

      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  alignRight: () => {
      const state = get();
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      if (selected.length < 2) return;
      state.saveToHistory();
      
      // Find max Right edge (x + width)
      const rights = selected.map(f => {
          const dims = state._getFieldDimensions(f);
          return dims.x + dims.width;
      });
      const maxRight = Math.max(...rights);
      
      const updates = new Map();
      selected.forEach(f => {
           const dims = state._getFieldDimensions(f);
           updates.set(f.id, { x: maxRight - dims.width });
      });

      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  alignTop: () => {
      // PDF Coordinates: Y=0 is Bottom. Y+ is Up.
      // "Top" is the highest Y value (plus height).
      const state = get();
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      if (selected.length < 2) return;
      state.saveToHistory();
      
      // Find the highest "Top Edge" (y + height)
      const tops = selected.map(f => {
          const dims = state._getFieldDimensions(f);
          return dims.y + dims.height;
      });
      const maxTop = Math.max(...tops);
      
      const updates = new Map();
      selected.forEach(f => {
          const dims = state._getFieldDimensions(f);
          updates.set(f.id, { y: maxTop - dims.height });
      });

      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  alignMiddle: () => {
      const state = get();
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      if (selected.length < 2) return;
      state.saveToHistory();
      
      // Average Middle Y
      const middles = selected.map(f => {
          const dims = state._getFieldDimensions(f);
          return dims.y + (dims.height / 2);
      });
      const avgMiddle = middles.reduce((a, b) => a + b, 0) / middles.length;
      
      const updates = new Map();
      selected.forEach(f => {
          const dims = state._getFieldDimensions(f);
          updates.set(f.id, { y: avgMiddle - (dims.height / 2) });
      });

      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  alignBottom: () => {
      // PDF Coordinates: Y=0 is Bottom.
      // "Bottom" is the lowest Y value.
      const state = get();
      const selected = state.textFields.filter(f => state.selectedFieldIds.includes(f.id));
      if (selected.length < 2) return;
      state.saveToHistory();
      
      const minY = Math.min(...selected.map(f => f.y));
      
      const updates = new Map();
      selected.forEach(f => updates.set(f.id, { y: minY }));

      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  distributeHorizontally: () => {
      const state = get();
      const selected = state.textFields
        .filter(f => state.selectedFieldIds.includes(f.id))
        .sort((a,b) => a.x - b.x);
      
      if (selected.length < 3) return;
      state.saveToHistory();
      
      const minX = selected[0].x;
      const maxX = selected[selected.length - 1].x;
      const totalSpan = maxX - minX;
      const step = totalSpan / (selected.length - 1);
      
      const updates = new Map();
      selected.forEach((f, i) => updates.set(f.id, { x: minX + (step * i) }));
      
      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
  distributeVertically: () => {
      const state = get();
      const selected = state.textFields
        .filter(f => state.selectedFieldIds.includes(f.id))
        .sort((a,b) => a.y - b.y);
        
      if (selected.length < 3) return;
      state.saveToHistory();
      
      const minY = selected[0].y;
      const maxY = selected[selected.length - 1].y;
      const totalSpan = maxY - minY;
      const step = totalSpan / (selected.length - 1);
      
      const updates = new Map();
      selected.forEach((f, i) => updates.set(f.id, { y: minY + (step * i) }));
      
      set({
          textFields: state.textFields.map(f => updates.has(f.id) ? { ...f, ...updates.get(f.id) } : f),
      });
  },
}));
