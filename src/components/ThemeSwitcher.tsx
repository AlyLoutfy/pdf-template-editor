import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { Tooltip } from './Tooltip';

const THEMES = [
  { id: 'default', name: 'Zinc & Yellow', colors: ['#18181b', '#facc15'] },
  { id: 'zinc-violet', name: 'Zinc & Violet', colors: ['#18181b', '#8b5cf6'] },
  { id: 'slate-amber', name: 'Slate & Amber', colors: ['#0f172a', '#f59e0b'] },
  { id: 'gray-blue', name: 'Gray & Blue', colors: ['#111827', '#3b82f6'] },
  { id: 'stone-rose', name: 'Stone & Rose', colors: ['#1c1917', '#f43f5e'] },
  { id: 'neutral-red', name: 'Crimson Dark', colors: ['#171717', '#ef4444'] },
  { id: 'light', name: 'Clean Light', colors: ['#ffffff', '#8b5cf6'] },
  { id: 'light-warm', name: 'Warm Light', colors: ['#fafaf9', '#f59e0b'] },
  { id: 'light-cool', name: 'Cool Light', colors: ['#f8fafc', '#3b82f6'] },
] as const;

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip content="Change Theme" position="bottom">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2 flex items-center gap-2 rounded hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700"
        >
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full border border-neutral-600" style={{ backgroundColor: activeTheme.colors[0] }} />
            <div className="w-4 h-4 rounded-full border border-neutral-600" style={{ backgroundColor: activeTheme.colors[1] }} />
          </div>
          <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Select Theme
          </div>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-neutral-800 transition-colors ${
                currentTheme === theme.id ? 'text-primary-400 bg-neutral-800/50' : 'text-neutral-300'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
              </div>
              <span>{theme.name}</span>
              {currentTheme === theme.id && (
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
