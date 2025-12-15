import { useState, useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';

interface ShortcutItem {
  keys: string[];
  desc: string;
}

export function ShortcutsModal() {
  const { showShortcuts, setShowShortcuts } = useEditorStore();
  const [isMac, setIsMac] = useState(true);

  // Close on Escape & Detect Platform
  useEffect(() => {
    // Platform detection
    const isMacPlatform = /Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent);
    setIsMac(isMacPlatform);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showShortcuts && e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, setShowShortcuts]);

  if (!showShortcuts) return null;

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutItem[] = [
    { keys: ['V'], desc: 'Select Tool' },
    { keys: ['H'], desc: 'Hand / Pan Tool' },
    { keys: ['T'], desc: 'Text Tool' },
    { keys: ['I'], desc: 'Image Tool' },
    { keys: ['P'], desc: 'Peek Variables (Hold)' },
    { keys: [modKey, 'Z'], desc: 'Undo' },
    { keys: [modKey, 'Shift', 'Z'], desc: 'Redo' },
    { keys: ['Del'], desc: 'Delete Selected' },
    { keys: [modKey, 'C'], desc: 'Copy Styles' },
    { keys: [modKey, 'V'], desc: 'Paste Styles' },
    { keys: ['Arrows'], desc: 'Nudge Selection' },
    { keys: ['Shift', 'Arrows'], desc: 'Nudge (10px)' },
  ];

  const alignment: ShortcutItem[] = [
    { keys: [modKey, 'Shift', 'L'], desc: 'Align Left' },
    { keys: [modKey, 'Shift', 'C'], desc: 'Center Horizontally' },
    { keys: [modKey, 'Shift', 'R'], desc: 'Align Right' },
    { keys: [modKey, 'Shift', 'T'], desc: 'Align Top' },
    { keys: [modKey, 'Shift', 'M'], desc: 'Align Middle' },
    { keys: [modKey, 'Shift', 'B'], desc: 'Align Bottom' },
    { keys: [modKey, 'Shift', 'H'], desc: 'Distribute Horizontally' },
    { keys: [modKey, 'Shift', 'V'], desc: 'Distribute Vertically' },
    { keys: [modKey, 'Shift', 'S'], desc: 'Toggle Snapping' },
  ];

  const renderKeys = (keys: string[]) => (
    <div className="flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd 
          key={i} 
          className={`min-w-[24px] h-6 px-2 flex items-center justify-center bg-neutral-700/50 border border-neutral-600/50 rounded font-mono text-neutral-300 shadow-sm ${
            k === '⌘' ? 'text-base' : 'text-xs'
          }`}
        >
          {k}
        </kbd>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm transition-opacity"
        onClick={() => setShowShortcuts(false)}
      />

      {/* Modal */}
      <div className="relative bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 bg-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Keyboard Shortcuts
          </h2>
          <button 
            onClick={() => setShowShortcuts(false)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Essentials</h3>
            <div className="space-y-3">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-neutral-300 text-sm group-hover:text-primary-400 transition-colors">{s.desc}</span>
                  {renderKeys(s.keys)}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Alignment</h3>
            <div className="space-y-3">
              {alignment.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-neutral-300 text-sm group-hover:text-primary-400 transition-colors">{s.desc}</span>
                  {renderKeys(s.keys)}
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-neutral-700/50">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Toggle this menu</span>
                {renderKeys(['Shift', '?'])}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
