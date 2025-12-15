import { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import type { EditorTextField } from '../types';

export function PresetsModal() {
  const { 
    showPresets, 
    setShowPresets, 
    presets, 
    applyPreset, 
    currentPage, 
    deletePreset, 
    updatePreset,
    addPreset,
    numPages
  } = useEditorStore();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [targetPage, setTargetPage] = useState<number | string>(currentPage);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  // Sync target page with current page when modal opens
  useEffect(() => {
    if (showPresets) {
      setTargetPage(currentPage);
    }
  }, [showPresets, currentPage]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (presetToDelete) {
          setPresetToDelete(null); // Close delete modal first if open
        } else {
          setShowPresets(false);
        }
      }
    };
    
    if (showPresets) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPresets, setShowPresets, presetToDelete]);

  // Auto-select first preset
  useEffect(() => {
    if (showPresets && presets.length > 0 && !selectedPresetId) {
       setSelectedPresetId(presets[0].id);
    }
  }, [showPresets, presets, selectedPresetId]);

  if (!showPresets) return null;

  const activePreset = presets.find(p => p.id === selectedPresetId);

  const handleApply = () => {
    if (activePreset) {
      // Validate page number
      const pageNum = typeof targetPage === 'string' ? (parseInt(targetPage) || 1) : targetPage;
      const pageIndex = Math.max(0, Math.min(numPages - 1, pageNum - 1));
      applyPreset(activePreset.id, pageIndex);
      setShowPresets(false);
    }
  };

  const handleCreateNew = () => {
    const newId = Math.random().toString(36).substring(2, 11);
    addPreset({
      id: newId,
      name: 'New Preset',
      fields: []
    });
    setSelectedPresetId(newId);
  };

  const confirmDelete = () => {
    if (presetToDelete) {
      deletePreset(presetToDelete);
      setPresetToDelete(null);
      
      // If we deleted the active one, select another or none
      if (presetToDelete === selectedPresetId) {
         const remaining = presets.filter(p => p.id !== presetToDelete);
         setSelectedPresetId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const updateField = (fieldId: string, updates: Partial<EditorTextField>) => {
    if (!activePreset) return;
    const newFields = activePreset.fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    );
    updatePreset(activePreset.id, { fields: newFields });
  };

  const deleteField = (fieldId: string) => {
    if (!activePreset) return;
    const newFields = activePreset.fields.filter(f => f.id !== fieldId);
    updatePreset(activePreset.id, { fields: newFields });
  };

  const addField = () => {
    if (!activePreset) return;
    const newField: EditorTextField = {
      id: Math.random().toString(36).substring(2, 11),
      content: 'New Text',
      x: 50,
      y: 50,
      size: 14,
      color: '#000000',
      isHorizontallyCentered: false,
      isFullNumber: false,
      page: 0
    };
    updatePreset(activePreset.id, { fields: [...activePreset.fields, newField] });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-[900px] h-[70vh] flex overflow-hidden relative"
      >
        {/* LEFT SIDEBAR: LIST */}
        <div className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Presets</h2>
            <button 
              onClick={handleCreateNew}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Create New Preset"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {presets.length === 0 && (
              <div className="text-xs text-neutral-500 text-center py-8">
                No presets found.
              </div>
            )}
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                  selectedPresetId === preset.id 
                    ? 'bg-primary-500/10 text-primary-500' 
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="truncate font-medium">{preset.name}</div>
                <div className="text-xs opacity-50">{preset.fields.length}</div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT: EDITOR */}
        <div className="flex-1 flex flex-col bg-neutral-900 min-w-0">
          {activePreset ? (
            <>
              {/* HEADER */}
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Preset Name</label>
                  <input
                    type="text"
                    value={activePreset.name}
                    onChange={(e) => updatePreset(activePreset.id, { name: e.target.value })}
                    className="bg-transparent text-xl font-semibold text-white focus:outline-none border-b border-transparent focus:border-primary-500 w-full placeholder-neutral-600"
                    placeholder="Preset Name"
                  />
                </div>
                <div className="flex items-center gap-3">
                   {/* Page Selector */}
                   <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1 border border-neutral-700">
                      <span className="text-xs text-neutral-400">Page</span>
                      <input 
                        type="number"
                        min={1}
                        max={numPages}
                        value={targetPage}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTargetPage('');
                            return;
                          }
                          const parsed = parseInt(val);
                          if (!isNaN(parsed)) {
                            // Don't clamp strictly while typing to allow backspacing, 
                            // but prevent non-sense high numbers if beneficial. 
                            // For now just allow it, clamp on blur.
                            setTargetPage(parsed);
                          }
                        }}
                        onBlur={() => {
                          let num = typeof targetPage === 'string' ? parseInt(targetPage) : targetPage;
                          if (isNaN(num) || num < 1) num = 1;
                          if (num > numPages) num = numPages;
                          setTargetPage(num);
                        }}
                        className="bg-transparent w-8 text-center text-sm font-medium text-white focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                   </div>

                  <button
                    onClick={handleApply}
                    className="px-4 py-1 bg-primary-500 hover:bg-primary-400 text-neutral-900 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20 text-sm h-[30px]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply
                  </button>
                  
                  <div className="w-px h-8 bg-neutral-700 mx-1" />
                  
                  <button
                    onClick={() => setPresetToDelete(activePreset.id)}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Preset"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  <button 
                     onClick={() => setShowPresets(false)}
                     className="ml-2 text-neutral-500 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* FIELDS LIST */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-medium text-neutral-300">Fields ({activePreset.fields.length})</h3>
                     <button 
                       onClick={addField}
                       className="text-xs flex items-center gap-1 text-primary-500 hover:text-primary-400 font-medium px-2 py-1 hover:bg-primary-500/10 rounded transition-colors"
                     >
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                       Add Field
                     </button>
                  </div>
                
                  {activePreset.fields.length > 0 ? (
                      <>
                          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 px-4 mb-2">
                            <div className="w-[40%]">CONTENT</div>
                            <div className="w-[15%] text-center">SIZE (px)</div>
                            <div className="w-[15%] text-center">COLOR</div>
                            <div className="w-[20%] text-center">POSITION (x, y)</div>
                            <div className="w-[10%] text-right">ACTION</div>
                          </div>
                      
                          {activePreset.fields.map((field, idx) => (
                            <div key={field.id || idx} className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-3 flex items-center gap-4 hover:border-neutral-700 transition-colors group">
                              {/* Content Input */}
                              <div className="w-[40%]">
                                <input 
                                    type="text" 
                                    value={field.content}
                                    onChange={(e) => updateField(field.id, { content: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none placeholder-neutral-600"
                                    placeholder="e.g. {varName}"
                                />
                              </div>

                              {/* Size Input */}
                              <div className="w-[15%]">
                                <input 
                                    type="number" 
                                    value={field.size}
                                    onChange={(e) => updateField(field.id, { size: Number(e.target.value) })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white text-center focus:border-primary-500 focus:outline-none"
                                />
                              </div>

                              {/* Color Picker */}
                              <div className="w-[15%] flex justify-center">
                                 <div className="relative group/picker">
                                    <input 
                                        type="color" 
                                        value={field.color}
                                        onChange={(e) => updateField(field.id, { color: e.target.value })}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                 </div>
                              </div>

                              {/* Position Inputs */}
                              <div className="w-[20%] flex gap-1 justify-center">
                                 <input 
                                    type="number" 
                                    value={Math.round(field.x)}
                                    onChange={(e) => updateField(field.id, { x: Number(e.target.value) })}
                                    className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1 py-1.5 text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                                    title="X"
                                 />
                                 <input 
                                    type="number" 
                                    value={Math.round(field.y)}
                                    onChange={(e) => updateField(field.id, { y: Number(e.target.value) })}
                                    className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1 py-1.5 text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                                    title="Y"
                                 />
                              </div>

                              {/* Delete */}
                              <div className="w-[10%] flex justify-end">
                                <button 
                                    onClick={() => deleteField(field.id)}
                                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-700 rounded transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                      </>
                   ) : (
                      <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-lg">
                        <p className="text-neutral-500 mb-2">This preset is empty.</p>
                        <button 
                           onClick={addField}
                           className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-sm transition-colors"
                        >
                           Add First Field
                        </button>
                      </div>
                   )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
               <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
               <p className="text-lg">Select a preset to edit</p>
               <button 
                 onClick={handleCreateNew}
                 className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
               >
                 Create New Preset
               </button>
            </div>
          )}
        </div>

        {/* DELETE CONFIRMATION MODAL OVERLAY */}
        {presetToDelete && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
             <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform scale-100 transition-all">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-white text-center mb-2">Delete Preset?</h3>
                <p className="text-neutral-400 text-center mb-6 text-sm">
                  Are you sure you want to delete <span className="text-white font-medium">"{presets.find(p => p.id === presetToDelete)?.name}"</span>? This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPresetToDelete(null)}
                    className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-neutral-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
