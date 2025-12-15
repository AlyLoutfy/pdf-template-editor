import { useState, useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { Tooltip } from './Tooltip';

export function StatusBar() {
  const { 
    zoom, 
    setZoom, 
    snapEnabled, 
    setSnapEnabled,
    showVariables,
    setShowVariables,
    setShowShortcuts,
    textFields
  } = useEditorStore();

  /* Local state for zoom input to allow free typing without cursor jumps */
  const [localZoom, setLocalZoom] = useState(`${Math.round(zoom * 100)}%`);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true); // Visual only

  // Sync local input with store zoom when not editing
  useEffect(() => {
    if (!isEditingZoom) {
      setLocalZoom(`${Math.round(zoom * 100)}%`);
    }
  }, [zoom, isEditingZoom]);

  const handleZoomCommit = () => {
    // Strip non-numeric characters
    const val = localZoom.replace(/[^0-9]/g, '');
    if (val) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        // Clamp between 10% and 500%
        const clamped = Math.max(10, Math.min(500, num));
        setZoom(clamped / 100);
        setLocalZoom(`${clamped}%`);
      } else {
        // Revert to current zoom if invalid
        setLocalZoom(`${Math.round(zoom * 100)}%`);
      }
    } else {
      setLocalZoom(`${Math.round(zoom * 100)}%`);
    }
    setIsEditingZoom(false);
  };

  /* 
     User requested "sum of number of texts places". 
     We interpret this as Text Fields + Payment Plan tables (which are also content).
     Images typically act as stand-alone pages in this app, so we exclude them.
  */
  const totalObjects = textFields.length + useEditorStore(s => s.paymentPlans).length;

  return (
    <div className="h-8 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-3 text-xs select-none z-[60]">
      
      {/* Left: Status Info */}
      <div className="flex items-center gap-4 text-neutral-500">
        <div className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-pointer" onClick={() => setShowShortcuts(true)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Shortcuts</span>
        </div>
        
        <div className="w-px h-3 bg-neutral-800" />
        
        <span>Page: {useEditorStore(s => s.currentVirtualPageIndex) + 1}</span>
        
        <div className="w-px h-3 bg-neutral-800" />

        <span>Total Elements: {totalObjects}</span>

        <div className="w-px h-3 bg-neutral-800" />

        {/* Auto Save Toggle (Visual Only) */}
        <Tooltip content={isAutoSaveEnabled ? "Auto-Save Enabled" : "Auto-Save Disabled"}>
          <button 
            onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${isAutoSaveEnabled ? 'bg-primary-500/10 text-primary-500' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Auto-Save</span>
          </button>
        </Tooltip>
      </div>

      {/* Right: View Controls */}
      <div className="flex items-center gap-2">
        
        {/* Toggle Snapping */}
        <Tooltip content={snapEnabled ? "Snapping Enabled (⌘⇧S to toggle)" : "Snapping Disabled (⌘⇧S to toggle)"}>
          <button 
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${snapEnabled ? 'bg-primary-500/10 text-primary-500' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Snap</span>
          </button>
        </Tooltip>

        <div className="w-px h-3 bg-neutral-800" />

        {/* Toggle Variable Peek */}
        <Tooltip content="Show Variable Names (P)">
          <button 
            onClick={() => setShowVariables(!showVariables)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${showVariables ? 'bg-primary-500/10 text-primary-500' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Peek</span>
          </button>
        </Tooltip>

        <div className="w-px h-3 bg-neutral-800" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setZoom(Math.max(0.1, zoom - 0.05))}
            className="p-1 text-neutral-400 hover:text-neutral-200"
            title="Zoom Out (-)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <input
            type="text"
            className="w-12 text-center bg-transparent text-neutral-400 font-mono tracking-wide focus:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary-500/50 rounded hover:bg-neutral-800 transition-colors"
            value={localZoom}
            onChange={(e) => {
              setLocalZoom(e.target.value);
              setIsEditingZoom(true);
            }}
            onBlur={handleZoomCommit}
            onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                     handleZoomCommit();
                     (e.target as HTMLInputElement).blur();
                 }
                 if (e.key === 'ArrowUp') {
                     e.preventDefault();
                     setZoom(Math.min(5, zoom + 0.01));
                 }
                 if (e.key === 'ArrowDown') {
                     e.preventDefault();
                     setZoom(Math.max(0.1, zoom - 0.01));
                 }
            }}
            title="Click to type exact zoom %"
          />
          
          <button 
            onClick={() => setZoom(Math.min(5, zoom + 0.05))}
            className="p-1 text-neutral-400 hover:text-neutral-200"
            title="Zoom In (+)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
