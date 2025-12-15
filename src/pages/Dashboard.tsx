import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { saveFile } from '../utils/storage';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export function Dashboard() {
  const navigate = useNavigate();
  const { 
    developers, 
    compounds, 
    templates,
    addDeveloper, 
    deleteDeveloper, 
    updateDeveloper,
    addCompound,
    deleteCompound,
    updateCompound,
    addTemplate,
    deleteTemplate,
    updateTemplate
  } = useProjectStore();

  // Selection Selection
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);

  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'developer' | 'compound' | 'template';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'developer', id: '', name: '' });

  // Quick Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Creation State
  const [isAddingDev, setIsAddingDev] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  
  const [isAddingCompound, setIsAddingCompound] = useState(false);
  const [newCompoundName, setNewCompoundName] = useState('');

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Derived Lists
  const activeCompounds = selectedDevId 
    ? compounds.filter(c => c.developerId === selectedDevId) 
    : [];
  
  const activeTemplates = selectedCompoundId
    ? templates.filter(t => t.compoundId === selectedCompoundId && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // --- Handlers ---

  const handleCreateDev = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDevName.trim()) {
      addDeveloper(newDevName.trim());
      setNewDevName('');
      setIsAddingDev(false);
    }
  };

  const handleCreateCompound = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompoundName.trim() && selectedDevId) {
      addCompound(selectedDevId, newCompoundName.trim());
      setNewCompoundName('');
      setIsAddingCompound(false);
    }
  };

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCompoundId) {
      const name = file.name.replace(/\.pdf$/i, '');
      const id = addTemplate(selectedCompoundId, name);
      saveFile(id, file).then(() => {
        // Automatically open editor
        navigate(`/editor/${id}`);
      });
    }
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openDeleteModal = (type: 'developer' | 'compound' | 'template', id: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  const confirmDelete = () => {
    const { type, id } = deleteModal;
    if (type === 'developer') {
      deleteDeveloper(id);
      if (selectedDevId === id) {
        setSelectedDevId(null);
        setSelectedCompoundId(null);
      }
    } else if (type === 'compound') {
      deleteCompound(id);
      if (selectedCompoundId === id) setSelectedCompoundId(null);
    } else if (type === 'template') {
      deleteTemplate(id);
    }
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (type: 'developer' | 'compound' | 'template') => {
    if (editingId && editName.trim()) {
      if (type === 'developer') updateDeveloper(editingId, editName.trim());
      else if (type === 'compound') updateCompound(editingId, editName.trim());
      else if (type === 'template') updateTemplate(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Dashboard Header */}
      <div className="h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-6 flex-shrink-0">
         <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-neutral-900 font-bold text-lg">
                 O
             </div>
             <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Offer Editor</h1>
         </div>

         <div className="flex items-center gap-4">
             {/* Search Bar */}
             <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="w-4 h-4 text-neutral-500 group-focus-within:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                 </div>
                 <input 
                    type="text" 
                    placeholder="Search templates..." 
                    className="bg-neutral-800 border-none rounded-lg py-1.5 pl-9 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:ring-2 focus:ring-primary-500/50 w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>

             <div className="h-6 w-px bg-neutral-800" />

             {/* Theme Switcher */}
             <ThemeSwitcher />
         </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COL 1: Developers (Always Visible) */}
        <div className="w-1/3 min-w-[300px] border-r border-neutral-800 flex flex-col bg-neutral-900/30 transition-all duration-300">
           {/* ... existing developer column content ... */}
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
            <h2 className="font-semibold text-neutral-300">Developers</h2>
            <button 
              onClick={() => setIsAddingDev(true)}
              className="p-1.5 text-primary-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isAddingDev && (
               <form onSubmit={handleCreateDev} className="p-2 mb-2 bg-neutral-800/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                 <input 
                   autoFocus
                   placeholder="Developer Name..."
                   className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1.5 text-sm mb-2 focus:ring-1 focus:ring-primary-500 outline-none"
                   value={newDevName}
                   onChange={e => setNewDevName(e.target.value)}
                   onKeyDown={e => e.key === 'Escape' && setIsAddingDev(false)}
                 />
                 <div className="flex justify-end gap-2 text-xs">
                   <button type="button" onClick={() => setIsAddingDev(false)} className="text-neutral-400 hover:text-white">Cancel</button>
                   <button type="submit" className="text-primary-400 hover:text-primary-300 font-medium">Create</button>
                 </div>
               </form>
            )}

            {developers.map(dev => (
              <div 
                key={dev.id}
                onClick={() => {
                    setSelectedDevId(dev.id);
                    setSelectedCompoundId(null);
                }}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedDevId === dev.id 
                    ? 'bg-primary-900/20 border border-primary-500/30 shadow-sm' 
                    : 'hover:bg-neutral-800 border border-transparent'
                }`}
              >
                {/* ... existing developer item content ... */}
                {editingId === dev.id ? (
                    <input 
                      autoFocus
                      className="flex-1 bg-neutral-950 text-white rounded px-1.5 py-0.5 outline-none border border-primary-500/50"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => saveEdit('developer')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit('developer');
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            selectedDevId === dev.id ? 'bg-primary-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                            {dev.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${selectedDevId === dev.id ? 'text-white' : 'text-neutral-400'}`}>
                            {dev.name}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing(dev.id, dev.name);
                        }}
                        className="p-1 text-neutral-500 hover:text-white"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button 
                         onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal('developer', dev.id, dev.name);
                        }}
                        className="p-1 text-neutral-500 hover:text-red-400"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <svg className={`w-4 h-4 text-neutral-600 ${selectedDevId === dev.id ? 'text-primary-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
              </div>
            ))}
            
            {developers.length === 0 && !isAddingDev && (
                <div className="text-center py-8 text-neutral-600 text-sm">
                    No developers yet.<br/>Start by adding one.
                </div>
            )}
          </div>
        </div>

        {/* COL 2: Compounds (Dynamic Slide-in) */}
        <div className={`border-r border-neutral-800 flex flex-col bg-neutral-900/10 transition-all duration-300 ease-in-out origin-left ${
            selectedDevId ? 'w-1/3 min-w-[300px] opacity-100 scale-100' : 'w-0 min-w-0 opacity-0 scale-95 overflow-hidden'
        }`}>
           <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 min-w-[300px]">
            <h2 className="font-semibold text-neutral-300">Compounds</h2>
            {selectedDevId && (
                <button 
                  onClick={() => setIsAddingCompound(true)}
                  className="p-1.5 text-primary-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[300px]">
             {/* ... existing compound list logic ... */}
             {isAddingCompound && (
                <form onSubmit={handleCreateCompound} className="p-2 mb-2 bg-neutral-800/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <input 
                    autoFocus
                    placeholder="Compound Name..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1.5 text-sm mb-2 focus:ring-1 focus:ring-primary-500 outline-none"
                    value={newCompoundName}
                    onChange={e => setNewCompoundName(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && setIsAddingCompound(false)}
                    />
                    <div className="flex justify-end gap-2 text-xs">
                    <button type="button" onClick={() => setIsAddingCompound(false)} className="text-neutral-400 hover:text-white">Cancel</button>
                    <button type="submit" className="text-primary-400 hover:text-primary-300 font-medium">Add</button>
                    </div>
                </form>
            )}
            
            {activeCompounds.map(comp => (
                <div 
                   key={comp.id}
                   onClick={() => setSelectedCompoundId(comp.id)}
                   className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCompoundId === comp.id 
                        ? 'bg-primary-900/20 border border-primary-500/30 shadow-sm' 
                        : 'hover:bg-neutral-800 border border-transparent'
                   }`}
                >
                    {/* ... compound item content ... */}
                    {editingId === comp.id ? (
                        <input 
                        autoFocus
                        className="flex-1 bg-neutral-950 text-white rounded px-1.5 py-0.5 outline-none border border-primary-500/50"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => saveEdit('compound')}
                        onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit('compound');
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${selectedCompoundId === comp.id ? 'bg-primary-500' : 'bg-neutral-700'}`} />
                            <span className={`font-medium ${selectedCompoundId === comp.id ? 'text-white' : 'text-neutral-400'}`}>
                                {comp.name}
                            </span>
                        </div>
                    )}

                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                startEditing(comp.id, comp.name);
                            }}
                            className="p-1 text-neutral-500 hover:text-white"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal('compound', comp.id, comp.name);
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <svg className={`w-4 h-4 text-neutral-600 ${selectedCompoundId === comp.id ? 'text-primary-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            ))}

            {activeCompounds.length === 0 && !isAddingCompound && (
                 <div className="text-center py-8 text-neutral-600 text-sm">
                     No compounds here.
                </div>
            )}
           
           {/* Quick Add Button removed as per request */}
          </div>
        </div>

        {/* COL 3: Templates (Dynamic Slide-in) */}
        <div className={`flex-col bg-neutral-900/5 transition-all duration-300 ease-in-out origin-left ${
            selectedCompoundId ? 'flex-1 opacity-100 scale-100 flex' : 'w-0 opacity-0 scale-95 overflow-hidden'
        }`}>
           <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 min-w-[300px]">
            <h2 className="font-semibold text-neutral-300">Templates (PDFs)</h2>
             {/* Upload Button in Header */}
             <label className="p-1.5 text-primary-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handleUploadTemplate}
                />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-w-[300px]">
             {!selectedCompoundId ? (
                 <div className="flex flex-col items-center justify-center h-full text-neutral-600 text-sm opacity-50">
                    <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Select a compound to view templates
                 </div>
             ) : (
                 <div className="space-y-3">
                     {activeTemplates.map(tpl => (
                          <div key={tpl.id} className="relative group bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-800/50 transition-all flex items-center p-3 gap-4">
                              <Link 
                                to={`/editor/${tpl.id}`} 
                                className="flex-1 flex items-center gap-4"
                                onClick={(e) => {
                                  if (editingId === tpl.id) e.preventDefault();
                                }}
                              >
                                  {/* Icon / Thumbnail */}
                                  <div className="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center flex-shrink-0 text-neutral-500 group-hover:text-primary-400 group-hover:bg-neutral-700/50 transition-colors">
                                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                     </svg>
                                  </div>
                                  
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                      {editingId === tpl.id ? (
                                        <input 
                                          autoFocus
                                          className="w-full bg-neutral-950 text-white rounded px-1.5 py-0.5 outline-none border border-primary-500/50"
                                          value={editName}
                                          onChange={e => setEditName(e.target.value)}
                                          onBlur={() => saveEdit('template')}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') saveEdit('template');
                                            if (e.key === 'Escape') setEditingId(null);
                                          }}
                                          onClick={e => e.preventDefault()}
                                        />
                                      ) : (
                                        <h3 className="font-medium text-white truncate group-hover:text-primary-400 transition-colors" title={tpl.name}>
                                            {tpl.name}
                                        </h3>
                                      )}
                                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                                         <span>{new Date(tpl.updatedAt).toLocaleDateString()}</span>
                                         <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                         <span>{tpl.elementCount || 0} elements</span>
                                      </div>
                                  </div>
                              </Link>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                      onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          startEditing(tpl.id, tpl.name);
                                      }}
                                      className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                                      title="Rename"
                                  >
                                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                  </button>
                                  <button 
                                      onClick={(e) => {
                                          e.preventDefault();
                                          openDeleteModal('template', tpl.id, tpl.name);
                                      }}
                                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-700 rounded transition-colors"
                                      title="Delete"
                                   >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                  </button>
                              </div>
                          </div>
                     ))}
                     
                     {activeTemplates.length === 0 && (
                         <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
                             <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                             </div>
                             <h3 className="text-neutral-400 font-medium mb-1">No templates yet</h3>
                             <p className="text-neutral-600 text-sm mb-4">Upload a PDF to get started</p>
                             <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer transition-colors text-sm font-medium">
                                <span>Upload PDF</span>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept=".pdf" 
                                    className="hidden" 
                                    onChange={handleUploadTemplate}
                                />
                             </label>
                         </div>
                     )}
                 </div>
             )}
          </div>
        </div>

      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1)}`}
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
