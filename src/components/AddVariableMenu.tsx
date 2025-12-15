import { useEffect, useRef, useState } from 'react';
import { AVAILABLE_VARIABLES } from '../types';

interface AddVariableMenuProps {
  x: number;
  y: number;
  onSelect: (variable: string) => void;
  onClose: () => void;
}

export function AddVariableMenu({ x, y, onSelect, onClose }: AddVariableMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Group variables by category
  const variablesByCategory = AVAILABLE_VARIABLES.reduce((acc, v) => {
    if (!v.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !v.category.toLowerCase().includes(searchTerm.toLowerCase())) {
        return acc;
    }
    
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_VARIABLES>);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{
        left: x,
        top: y,
        maxHeight: '320px',
      }}
    >
      <div className="p-2 border-b border-neutral-700">
        <input
          type="text"
          placeholder="Search variable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500 placeholder-neutral-500"
        />
      </div>

      <div className="overflow-y-auto flex-1 p-1">
        {Object.entries(variablesByCategory).length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-neutral-500">
            No variables found
          </div>
        ) : (
          Object.entries(variablesByCategory).map(([category, vars]) => (
            <div key={category} className="mb-2 last:mb-0">
              <div className="px-2 py-1 text-[10px] font-medium text-neutral-500 uppercase tracking-wider sticky top-0 bg-neutral-800/95 backdrop-blur-sm">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
              <div className="space-y-0.5">
                {vars.map((v) => (
                  <button
                    key={v.var}
                    onClick={() => onSelect(v.var)}
                    className="w-full px-2 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white rounded transition-colors flex items-center justify-between group"
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono group-hover:text-neutral-400">
                      {v.var}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Quick custom text option */}
      <div className="p-2 border-t border-neutral-700 bg-neutral-800">
        <button
            onClick={() => onSelect('Custom Text')}
            className="w-full px-2 py-1.5 text-center text-xs text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors font-medium border border-dashed border-primary-500/30"
        >
            Insert Custom Text
        </button>
      </div>
    </div>
  );
}
