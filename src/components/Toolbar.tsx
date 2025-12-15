import { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useProjectStore } from '../stores/projectStore';
import { saveFile } from '../utils/storage';
import { exportToLegacyJSON, exportToV2JSON, downloadJSON } from '../utils/jsonExporter'; // check imports
import { importJSON } from '../utils/jsonImporter';
import { generateSamplePdf, downloadPdf } from '../utils/pdfGenerator';

import { Tooltip } from './Tooltip';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Toolbar() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  // Project store for touching timestamp
  const { updateTemplate } = useProjectStore(); 

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportDropdownPosition, setExportDropdownPosition] = useState({ top: 0, right: 0 });
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const openDropdown = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setExportDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setIsExportDropdownOpen(true);
    }
  }, []);

  const closeDropdown = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsExportDropdownOpen(false);
      closeTimeoutRef.current = null;
    }, 150);
  }, []);

  const {
    pdfFile,
    setPdfFile,
    getSnapshot,
    activeTool,
    setActiveTool,
    selectedFieldIds,
    showJsonPanel,
    setShowJsonPanel,
    textFields,
    imageFields,
    // ... other state
    paymentPlans,
    numPages,
    setTextFields,
    setImageFields,
    setPaymentPlans,
    history,
    historyIndex,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
    undo,
    redo,
  } = useEditorStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = async () => {
    if (!templateId) return;
    setSaveStatus('saving');
    try {
        const snapshot = getSnapshot();
        // Save editor state
        await import('idb-keyval').then(idb => idb.set(`template-${templateId}`, snapshot));
        
        // Save PDF if it changed
        if (pdfFile) {
          await saveFile(templateId, pdfFile);
        }

        // Update metadata
        const elementCount = textFields.length + imageFields.length;
        updateTemplate(templateId, { elementCount });
        
        // Success state
        setSaveStatus('success');
        
        // Use Toast
        const { useToast } = await import('./Toast'); // Dynamic import to avoid cycles if any, or just import at top if safe
        useToast.getState().show("Changes saved successfully", "success");

        // Reset after delay
        setTimeout(() => setSaveStatus('idle'), 2000); 
    } catch (err) {
        console.error("Save failed", err);
        setSaveStatus('idle');
         const { useToast } = await import('./Toast');
         useToast.getState().show("Failed to save changes", "error");
    }
  };

  const hasMultipleSelected = selectedFieldIds.length >= 2;
  const hasThreeOrMoreSelected = selectedFieldIds.length >= 3;

  // ... (Export handlers remain same)

  // ... (Import handler remains same)
  
  // Re-declare handlers to ensure they are available in this scope since I am replacing the top block
  const handleExportLegacy = () => {
    const json = exportToLegacyJSON(textFields, imageFields, paymentPlans, numPages);
    downloadJSON(json, 'template-instructions.json');
  };

  const handleExportV2 = () => {
    const json = exportToV2JSON(textFields, imageFields, paymentPlans, numPages);
    downloadJSON(json, 'template-instructions-v2.json');
  };

  const handleExportSample = async () => {
    if (!pdfFile) return;
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const generatedPdfBytes = await generateSamplePdf(
        pdfBytes, 
        textFields, 
        useEditorStore.getState().getVirtualPages(), 
        imageFields
      );
      downloadPdf(generatedPdfBytes, 'sample-offer.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate sample PDF');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importJSON(content);
      if (result) {
        setTextFields(result.textFields);
        setImageFields(result.imageFields);
        setPaymentPlans(result.paymentPlans);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-2 toolbar relative z-50 min-w-0">
      
      {/* Back to Dashboard */}
      <Tooltip content="Back to Dashboard" position="bottom">
        <button 
            onClick={() => navigate('/')}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
      </Tooltip>

      {/* Spacer */}
      <div className=""/>

      {/* Save Button */}
      <Tooltip content={saveStatus === 'saving' ? "Saving..." : saveStatus === 'success' ? "Saved!" : "Save Template"} position="bottom">
        <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden ${
                saveStatus === 'success'
                ? "bg-primary-500 text-neutral-900 scale-110"
                : saveStatus === 'saving' 
                ? "bg-neutral-800 text-neutral-400"
                : "bg-neutral-100 text-neutral-900 hover:scale-105 hover:bg-white"
            }`}
        >
            {/* Idle Text: Save */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${saveStatus === 'idle' ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-4'}`}>
               <span className="text-[8px] font-extrabold uppercase tracking-wider">Save</span>
            </div>
            
            {/* Saving Icon: Spinner */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${saveStatus === 'saving' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
               <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            </div>

            {/* Success Icon: Checkmark */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform ${saveStatus === 'success' ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-180'}`}>
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </div>
        </button>
      </Tooltip>

      <div className="w-px h-6 bg-neutral-700 mx-1" />

      {/* File Controls */}
      <div className="flex items-center gap-1.5">
        <Tooltip content={pdfFile ? "Change PDF template" : "Upload PDF template"} position="top">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md cursor-pointer transition-colors text-sm whitespace-nowrap">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{pdfFile ? 'Change' : 'Upload PDF'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPdfFile(file);
              }}
            />
          </label>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-neutral-700 mx-1" />

      {/* Tool Selection */}
      <div className="flex items-center gap-1 bg-neutral-800 rounded-md p-0.5">
        <Tooltip content="Select & move elements (V)" position="top">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'select'
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="Pan around (H)" position="top">
          <button
            onClick={() => setActiveTool('hand')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'hand'
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="Add text field - click on PDF (T)" position="top">
          <button
            onClick={() => setActiveTool('text')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'text'
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Add Element (Gallery, Plans, etc.)" position="top">
          <button
            onClick={() => useEditorStore.getState().setShowAddMenu(true)}
            className="p-1.5 rounded transition-colors text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-neutral-700 mx-1" />

      {/* Selection indicator - Animated reveal */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
          selectedFieldIds.length > 0 ? 'max-w-[200px] mr-2 opacity-100' : 'max-w-0 mr-0 opacity-0'
        }`}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/20 border border-primary-500/30 rounded-md whitespace-nowrap">
          <span className="text-xs font-medium text-primary-400">
            {selectedFieldIds.length} selected
          </span>
        </div>
      </div>

      {/* Alignment & Distribution Group */}
      <div className="flex items-center gap-3">
        {/* Alignment */}
        <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 gap-0.5">
          <Tooltip content="Align left (⌘⇧L)">
            <button
              onClick={() => alignLeft()}
              disabled={!hasMultipleSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h1v12H2V2zm4 3h9v2H6V5zm0 6h5v2H6v-2z" />
              </svg>
            </button>
          </Tooltip>
          
          <Tooltip content="Align center (⌘⇧C)">
            <button
              onClick={() => alignCenter()}
              disabled={selectedFieldIds.length < 1}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.5 2h1v12h-1V2zM3 5h3v2H3V5zm10 0H9v2h4V5zm-8 6h3v2H5v-2zm8 0H9v2h4v-2z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content="Align right (⌘⇧R)">
            <button
              onClick={() => alignRight()}
              disabled={!hasMultipleSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13 2h1v12h-1V2zM2 5h9v2H2V5zm4 6h5v2H6v-2z" />
              </svg>
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-neutral-700 mx-0.5" />

          <Tooltip content="Align top (⌘⇧T)">
            <button
              onClick={() => alignTop()}
              disabled={!hasMultipleSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm3 4h2v9H5V6zm6 0h2v5h-2V6z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content="Align middle (⌘⇧M)">
            <button
              onClick={() => alignMiddle()}
              disabled={!hasMultipleSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 7.5h12v1H2v-1zM5 3h2v3H5V3zm6 0h2v3h-2V3zm-6 6h2v5H5V9zm6 0h2v3h-2V9z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content="Align bottom (⌘⇧B)">
            <button
              onClick={() => alignBottom()}
              disabled={!hasMultipleSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 13h12v1H2v-1zM5 4h2v9H5V4zm6 4h2v5h-2V8z" />
              </svg>
            </button>
          </Tooltip>
        </div>

        {/* Distribution */}
        <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 gap-0.5">
          <Tooltip content="Distribute horizontally (⌘⇧H)">
            <button
              onClick={() => distributeHorizontally()}
              disabled={!hasThreeOrMoreSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h1v12H2V2zm11 0h1v12h-1V2zM5.5 5h2v6h-2V5zM8.5 5h2v6h-2V5z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content="Distribute vertically (⌘⇧V)">
            <button
              onClick={() => distributeVertically()}
              disabled={!hasThreeOrMoreSelected}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2v1h12V2H2zm0 11v1h12v-1H2zM5 5.5v2h6v-2H5zM5 8.5v2h6v-2H5z" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Tooltip content="Undo last action (⌘Z)">
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="Redo last action (⌘⇧Z)">
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </Tooltip>
      </div>




      <div className="w-px h-6 bg-neutral-700 mx-1" />



      {/* Presets */}
      <Tooltip content="Presets Library">
        <button
          onClick={() => useEditorStore.getState().setShowPresets(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Presets
        </button>
      </Tooltip>

      <div className="w-px h-6 bg-neutral-700 mx-1" />

      {/* Import/Export */}
      <div className="flex items-center gap-2">
        <Tooltip content="Import JSON instructions" position="top">
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md cursor-pointer transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Import
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
          </label>
        </Tooltip>
        
        <div className="relative">
          <button 
            ref={exportButtonRef}
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-500 hover:bg-primary-400 text-neutral-900 font-medium rounded-md transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExportDropdownOpen && createPortal(
            <div 
              ref={exportDropdownRef}
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
              className="fixed bg-neutral-900/95 backdrop-blur-sm rounded-lg shadow-2xl z-[99999] min-w-[200px] border border-white/10 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: `${exportDropdownPosition.top}px`,
                right: `${exportDropdownPosition.right}px`,
              }}
            >
              <div className="p-1">
                <button
                  onClick={handleExportLegacy}
                  className="w-full px-3 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 group"
                >
                  <div className="p-1 rounded bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Legacy JSON</span>
                    <span className="text-[10px] text-neutral-500">Original format</span>
                  </div>
                </button>
                <button
                  onClick={handleExportV2}
                  className="w-full px-3 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 group"
                >
                  <div className="p-1 rounded bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">V2 JSON</span>
                    <span className="text-[10px] text-neutral-500">Optimized structure</span>
                  </div>
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button
                  onClick={handleExportSample}
                  className="w-full px-3 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 group"
                >
                   <div className="p-1 rounded bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Export Sample PDF</span>
                    <span className="text-[10px] text-neutral-500">Preview output</span>
                  </div>
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="w-px h-6 bg-neutral-700 mx-2" />
      
      <ThemeSwitcher />

      <div className="w-px h-6 bg-neutral-700 mx-2" />

      {/* Toggle JSON Panel */}
      <Tooltip content={showJsonPanel ? "Hide JSON panel" : "Show JSON panel"}>
        <button
          onClick={() => setShowJsonPanel(!showJsonPanel)}
          className={`p-1.5 rounded transition-colors ${
            showJsonPanel
              ? 'bg-neutral-700 text-neutral-200'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
}

