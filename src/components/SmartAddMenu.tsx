import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';

type AddType = 'gallery' | 'floorPlan' | 'unitLocation' | 'paymentPlan';

interface MenuOption {
  id: AddType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: MenuOption[] = [
  {
    id: 'gallery',
    title: 'Offer Gallery',
    description: 'Add a full-page gallery section',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'floorPlan',
    title: 'Floor Plans',
    description: 'Add floor plan images',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'unitLocation',
    title: 'Unit Location',
    description: 'Mark location on master plan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'paymentPlan',
    title: 'Payment Plan',
    description: 'Insert payment schedule table',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export function SmartAddMenu() {
  const {
    showAddMenu,
    setShowAddMenu,
    addImageField,
    addPaymentPlan,
    currentPage,
    imageFields,
    paymentPlans,
    deleteImageField,
    deletePaymentPlan,
  } = useEditorStore();

  const [selectedType, setSelectedType] = useState<AddType | null>(null);

  // Configuration States
  const [insertPage, setInsertPage] = useState<string>('');
  const [sizing, setSizing] = useState<'matchWidth' | 'matchHeight'>('matchWidth');
  const [useExistingPage, setUseExistingPage] = useState(false);
  
  // Payment Plan Specific
  const [ppSelectedOnly, setPpSelectedOnly] = useState(true);
  const [ppId, setPpId] = useState('');
  const [ppPageRef, setPpPageRef] = useState('{length}');
  const [ppMode, setPpMode] = useState<'insert' | 'reference'>('insert');

  if (!showAddMenu) return null;

  const handleAdd = () => {
    if (!selectedType) return;

    // Calculate insertion page (default to current if empty)
    const targetPage = insertPage ? parseInt(insertPage) - 1 : currentPage - 1;

    const id = Math.random().toString(36).substring(2, 11);

    if (selectedType === 'paymentPlan') {
      addPaymentPlan({
        id,
        insertAfterPage: ppMode === 'insert' ? (insertPage ? parseInt(insertPage) : 0) : 0,
        pageReference: ppMode === 'reference' ? ppPageRef : undefined,
        selectedOnly: ppSelectedOnly,
        paymentPlanId: !ppSelectedOnly && ppId ? ppId : undefined,
      });
    } else {
      // Image Types
      let varName = '';
      if (selectedType === 'gallery') varName = '{offerGallery}';
      if (selectedType === 'floorPlan') varName = '{floorPlansImagesUrl}';
      if (selectedType === 'unitLocation') varName = '{unitLocationImage}';

      // For Unit Location, we might support "Existing Page" mode
      // But the store expects `insertNewPages: boolean`.
      const insertNew = selectedType === 'gallery' || (selectedType === 'unitLocation' && !useExistingPage) || selectedType === 'floorPlan';

      addImageField({
        id,
        type: selectedType,
        var: varName,
        insertAfterPage: targetPage,
        sizing,
        insertNewPages: insertNew,
        pageReference: useExistingPage ? (insertPage || '0') : undefined, // If existing, we point to it
      });
    }

    // Reset and Close? Or stay open? Usually close after add.
    // But maybe they want to add multiple. Let's keep open but show success or reset form.
    // For now, reset selection to allow adding another or reviewing list.
    setSelectedType(null);
  };

  // Combined list of existing elements for the sidebar
  const existingElements = [
    ...imageFields.map(f => ({ ...f, kind: 'image' as const })),
    ...paymentPlans.map(p => ({ ...p, kind: 'plan' as const }))
  ].sort(() => 0);

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 w-full max-w-4xl h-[600px] flex overflow-hidden">
        
        {/* Left Sidebar: Existing Elements */}
        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-medium text-neutral-200">Configured Elements</h3>
            <p className="text-xs text-neutral-500 mt-1">{existingElements.length} items added</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {existingElements.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-8">No elements yet</p>
            )}
            {existingElements.map(el => (
              <div key={el.id} className="p-3 bg-neutral-800 hover:bg-neutral-800/50 border border-neutral-700/50 rounded-lg group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary-500 uppercase tracking-wider">
                    {el.kind === 'image' ? (el as any).type : 'Payment Plan'}
                  </span>
                  <button 
                    onClick={() => el.kind === 'image' ? deleteImageField(el.id) : deletePaymentPlan(el.id)}
                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-neutral-400 truncate">
                  {el.kind === 'image' 
                    ? ((el as any).insertNewPages ? `After Pg ${(el as any).insertAfterPage + 1}` : `On Pg ${(el as any).pageReference || '?'}`)
                    : `Ref: ${(el as any).pageReference}`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-neutral-800/30">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
            <div>
              <h2 className="text-xl font-semibold text-neutral-100">Add Element</h2>
              <p className="text-sm text-neutral-400 mt-1">Insert dynamic content pages into your offer</p>
            </div>
            <button 
              onClick={() => setShowAddMenu(false)}
              className="p-2 text-neutral-400 hover:text-neutral-200 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedType ? (
              <div className="grid grid-cols-2 gap-4">
                {OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                        setSelectedType(opt.id);
                        // Reset form defaults
                        setInsertPage((currentPage).toString());
                        setUseExistingPage(false);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-neutral-800 border-2 border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-700/50 rounded-xl transition-all group text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4 text-neutral-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                      {opt.icon}
                    </div>
                    <h3 className="text-lg font-medium text-neutral-200 mb-2">{opt.title}</h3>
                    <p className="text-sm text-neutral-400">{opt.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button 
                  onClick={() => setSelectedType(null)}
                  className="mb-6 flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to options
                </button>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500">
                       {OPTIONS.find(o => o.id === selectedType)?.icon}
                     </div>
                     <div>
                       <h3 className="text-xl font-semibold text-neutral-100">
                         Configure {OPTIONS.find(o => o.id === selectedType)?.title}
                       </h3>
                     </div>
                   </div>

                   {/* Common: Page Selection */}
                   <div className="space-y-4">
                     {selectedType === 'unitLocation' && (
                        <div className="flex gap-4 p-1 bg-neutral-800 rounded-lg border border-neutral-700">
                          <button 
                            onClick={() => setUseExistingPage(false)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!useExistingPage ? 'bg-neutral-700 text-neutral-200 shadow-sm' : 'text-neutral-400 hover:text-neutral-300'}`}
                          >
                            New Placeholder Page
                          </button>
                          <button 
                            onClick={() => setUseExistingPage(true)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${useExistingPage ? 'bg-neutral-700 text-neutral-200 shadow-sm' : 'text-neutral-400 hover:text-neutral-300'}`}
                          >
                            Use Existing Page
                          </button>
                        </div>
                     )}

                     <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">
                          {useExistingPage ? 'Select Page Number' : `Insert After Page (Current: ${currentPage})`}
                        </label>
                        <input 
                          type="number"
                          value={insertPage}
                          onChange={(e) => setInsertPage(e.target.value)}
                          placeholder={useExistingPage ? "Page number" : "Leave empty for current"}
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-primary-500 transition-colors"
                        />
                     </div>

                     {selectedType !== 'paymentPlan' && (
                       <div>
                         <label className="block text-sm font-medium text-neutral-400 mb-1">Image Sizing</label>
                         <select 
                           value={sizing}
                           onChange={(e) => setSizing(e.target.value as any)}
                           className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-primary-500 transition-colors"
                         >
                           <option value="matchWidth">Match Width (Horizontal Scroll/Fit)</option>
                           <option value="matchHeight">Match Height (Vertical Fit)</option>
                         </select>
                       </div>
                     )}

                     {selectedType === 'paymentPlan' && (
                       <div className="space-y-4 pt-4 border-t border-neutral-800">
                          {/* Payment Plan Mode Toggle */}
                          <div className="flex gap-4 p-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            <button 
                              onClick={() => setPpMode('insert')}
                              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${ppMode === 'insert' ? 'bg-neutral-700 text-neutral-200 shadow-sm' : 'text-neutral-400 hover:text-neutral-300'}`}
                            >
                              Insert New Page
                            </button>
                            <button 
                              onClick={() => setPpMode('reference')}
                              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${ppMode === 'reference' ? 'bg-neutral-700 text-neutral-200 shadow-sm' : 'text-neutral-400 hover:text-neutral-300'}`}
                            >
                              Use Page Reference
                            </button>
                          </div>

                          {/* Mode-specific Inputs */}
                          {ppMode === 'insert' ? (
                             <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">
                                  Insert After Page (Current: {currentPage})
                                </label>
                                <input 
                                  type="number"
                                  value={insertPage}
                                  onChange={(e) => setInsertPage(e.target.value)}
                                  placeholder="Leave empty for current"
                                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-primary-500 transition-colors"
                                />
                             </div>
                          ) : (
                             <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Page Reference</label>
                                <input 
                                   type="text"
                                   value={ppPageRef}
                                   onChange={(e) => setPpPageRef(e.target.value)}
                                   className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 font-mono"
                                   placeholder="{length}"
                                />
                             </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                             <input 
                               type="checkbox"
                               checked={ppSelectedOnly}
                               onChange={(e) => setPpSelectedOnly(e.target.checked)}
                               id="pp-selected"
                               className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-primary-500"
                             />
                             <label htmlFor="pp-selected" className="text-sm text-neutral-300">Display user-selected plan only</label>
                          </div>
                          
                          {!ppSelectedOnly && (
                             <div>
                               <label className="block text-sm font-medium text-neutral-400 mb-1">Payment Plan ID</label>
                               <input 
                                  type="text"
                                  value={ppId}
                                  onChange={(e) => setPpId(e.target.value)}
                                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200"
                                  placeholder="e.g. plan_123"
                                />
                             </div>
                          )}
                       </div>
                     )}
                   </div>
                   
                   <button 
                     onClick={handleAdd}
                     className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-neutral-900 font-bold rounded-xl transition-colors mt-6"
                   >
                     Add Element
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
