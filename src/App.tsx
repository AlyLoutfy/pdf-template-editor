import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/EditorPage';

// Components
import { Toolbar } from './components/Toolbar';
import { PageThumbnails } from './components/PageThumbnails';
import { PdfViewer } from './components/PdfViewer';
import { FieldEditor } from './components/FieldEditor';
import { JsonPanel } from './components/JsonPanel';
import { PresetsModal } from './components/PresetsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SmartAddMenu } from './components/SmartAddMenu';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';
import { ResizeHandle } from './components/ResizeHandle';
import { DashboardLayout } from './components/DashboardLayout';

import { useEditorStore } from './stores/editorStore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Define the "EditorView" which was the old "App" content
function EditorView() {
  const { 
    currentTheme, 
    showJsonPanel,
    rightPanelWidth,
    jsonPanelHeight,
    setRightPanelWidth,
    setJsonPanelHeight,
    showShortcuts,
    viewMode,
    pdfUrl
  } = useEditorStore();

  // Initialize PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }, []);

  // Theme effect moved to App component

   // Keyboard shortcuts
   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // DEBUG LOG


      const store = useEditorStore.getState();
      const { selectedFieldIds } = store;

      // Duplicate (Cmd+D) - HANDLE FIRST / CAPTURE PRIORITY
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          e.stopPropagation(); // Stop bubbling
          store.duplicateSelected();
          return;
      }

      // Save (Cmd+S) - Strict, no Shift (Shift+Cmd+S is Toggle Snap or "Save As")
      if (isMod && !e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          e.stopPropagation();
          const match = window.location.pathname.match(/\/editor\/([^/]+)/);
          if (match && match[1]) {
             store.saveProject(match[1]);
          }
          return;
      }

      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isShift = e.shiftKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFieldIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      }

      // Tools (only if no modifiers)
      if (!isMod && !isShift) {
        switch (e.key.toLowerCase()) {
          case 'v':
            store.setActiveTool('select');
            break;
          case 'h':
            store.setActiveTool('hand');
            break;
          case 't':
            store.setActiveTool('text');
            break;
          case 'i':
            // "I" for Insert Menu (Gallery, Plans, etc.)
            e.preventDefault();
            store.setShowAddMenu(true);
            break;
        }
      }

      // Escape - clear selection
      if (e.key === 'Escape') {
        store.clearSelection();
        store.setActiveTool('select');
      }

      // Cmd/Ctrl + A - select all (on current page)
      if (isMod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        
        const state = useEditorStore.getState();
        // currentVirtualPageIndex is 0-indexed and maps directly to the field's page property
        const activePageIndex = state.currentVirtualPageIndex;
        
        const pageFieldIds = state.textFields
            .filter(f => f.page === activePageIndex)
            .map(f => f.id);
            
        if (pageFieldIds.length > 0) {
             state.selectFields(pageFieldIds);
        }
      }

      // Undo/Redo
      if (isMod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (isShift) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }

      // Copy/Paste
      if (isMod && !isShift && e.key.toLowerCase() === 'c' && selectedFieldIds.length === 1) {
         // Copy styles
         e.preventDefault();
         const field = store.textFields.find(f => f.id === selectedFieldIds[0]);
         if (field) store.copyStyles(field);
      }
      if (isMod && !isShift && e.key.toLowerCase() === 'v') {
         // Paste styles
         if (store.copiedStyles && selectedFieldIds.length > 0) {
             e.preventDefault();
             store.pasteStyles();
         }
      }

      // Zoom
      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        store.setZoom(store.zoom + 0.1);
      }
      if (isMod && e.key === '-') {
        e.preventDefault();
        store.setZoom(store.zoom - 0.1);
      }

      // Alignment (Cmd+Shift+Key)
      if (isMod && isShift) {
        switch (e.key.toLowerCase()) {
            case 'l': e.preventDefault(); e.stopPropagation(); store.alignLeft(); break;
            case 'c': e.preventDefault(); e.stopPropagation(); store.alignCenter(); break;
            case 'r': e.preventDefault(); e.stopPropagation(); store.alignRight(); break;
            case 't': 
                e.preventDefault(); 
                e.stopPropagation();
                store.alignTop(); 
                break;
            case 'm': e.preventDefault(); e.stopPropagation(); store.alignMiddle(); break;
            case 'b': 
                e.preventDefault(); 
                e.stopPropagation();
                store.alignBottom(); 
                break;
            case 'h': e.preventDefault(); e.stopPropagation(); store.distributeHorizontally(); break;
            case 'v': e.preventDefault(); e.stopPropagation(); store.distributeVertically(); break;
            case 's': e.preventDefault(); e.stopPropagation(); store.setSnapEnabled(!store.snapEnabled); break;
        }
      }

      // Peek Variables (Hold P)
      if (!isMod && !isShift && e.key.toLowerCase() === 'p') {

          // Only if not already showing (to avoid repeated state updates on key hold)
          if (!store.showVariables) {
              store.setShowVariables(true);
          }
      }

      // Shortcuts Menu (Shift + ?)
      if (!isMod && isShift && e.key === '?') {
          e.preventDefault();
          store.setShowShortcuts(!store.showShortcuts);
      }

      // Nudge
      if (selectedFieldIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const amount = isShift ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -amount : e.key === 'ArrowRight' ? amount : 0;
        const dy = e.key === 'ArrowUp' ? amount : e.key === 'ArrowDown' ? -amount : 0;
        store.moveSelected(dx, dy);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        // Release Peek Variables
        if (e.key.toLowerCase() === 'p') {

            useEditorStore.getState().setShowVariables(false);
        }
    };

    // Use Capture phase to intercept shortcuts like Cmd+D before browser!
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
        window.removeEventListener('keydown', handleKeyDown, { capture: true });
        window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus container for shortcuts
  useEffect(() => {
    containerRef.current?.focus();
  }, [pdfUrl]);

  return (
    <div 
        ref={containerRef}
        tabIndex={0}
        className={`flex flex-col h-screen bg-neutral-900 text-neutral-100 font-sans theme-${currentTheme} overflow-hidden outline-none`}
    >
      <Toolbar />
      
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Page Thumbnails Sidebar */}
        {pdfUrl && (
          <div className="w-28 bg-neutral-900/50 border-r border-neutral-800 overflow-y-auto flex-shrink-0">
            <PageThumbnails />
          </div>
        )}
        
        {/* Main Canvas */}
        <div className="flex-1 overflow-hidden bg-neutral-900/50 min-w-0 relative flex flex-col">
           {pdfUrl ? (
             <div className={`relative flex-1 h-full overflow-hidden flex flex-col ${viewMode === 'grid' ? 'p-8' : ''}`}>
               <PdfViewer />
             </div>
           ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <p className="mb-4">No PDF Loaded</p>
                  <p className="text-sm">Upload a PDF to get started</p>
                  <label className="mt-4 inline-block px-4 py-2 bg-primary-600 rounded cursor-pointer hover:bg-primary-500 text-white">
                    Upload PDF
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) useEditorStore.getState().setPdfFile(file);
                      }}
                    />
                  </label>
                </div>
              </div>
           )}
        </div>

        {/* Resizable Right Panel */}
        {pdfUrl && (
            <>
                <ResizeHandle
                    direction="horizontal"
                    value={rightPanelWidth}
                    onChange={setRightPanelWidth}
                    min={200}
                    max={800}
                    inverse={true}
                    className="w-1 flex-shrink-0 z-50 hover:z-50 bg-neutral-800 hover:bg-primary-500 transition-colors"
                />
                <div style={{ width: rightPanelWidth }} className="border-l border-neutral-800 bg-neutral-900 flex flex-col z-20 shadow-xl relative transition-all duration-100 ease-linear flex-shrink-0">
                   <FieldEditor />
                </div>
            </>
        )}
      </div>

      {showJsonPanel && pdfUrl && (
         <>
            <ResizeHandle
                direction="vertical"
                value={jsonPanelHeight}
                onChange={setJsonPanelHeight}
                min={150}
                max={600}
                inverse={true}
                className="h-1 flex-shrink-0 z-50 hover:z-50 bg-neutral-800 hover:bg-primary-500 transition-colors"
            />
            <div style={{ height: jsonPanelHeight }} className="border-t border-neutral-800 bg-neutral-900 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] relative transition-all duration-100 ease-linear flex-shrink-0">
              <JsonPanel />
            </div>
         </>
      )}

      {/* Overlays / Modals */}
      <SmartAddMenu />
      <StatusBar />
      <Toast />
      <PresetsModal />
      {showShortcuts && <ShortcutsModal />}
      {/* VariableListModal is handled by AddVariableMenu usage or integrated elsewhere if needed. */}
      
      {/* Hidden input for "I" shortcut */}
      {/* Hidden input for "I" shortcut - REMOVED as I now opens menu */}
    </div>
  );
}

// Main App Component with Routing
function App() {
  // Global Theme Effect
  const currentTheme = useEditorStore((state) => state.currentTheme);

  useEffect(() => {
    document.documentElement.className = currentTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark' || currentTheme === 'midnight' || currentTheme === 'forest') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  return (
    <BrowserRouter basename="/pdf-template-editor">
      <Routes>
        <Route path="/" element={
           <DashboardLayout>
              <Dashboard />
           </DashboardLayout>
        } />
        <Route path="/editor/:templateId" element={
          <EditorPage>
             <EditorView /> 
          </EditorPage>
        } />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
