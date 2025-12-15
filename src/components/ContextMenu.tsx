import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: (ContextMenuItem | 'divider')[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  // Prevent menu from going off-screen

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
    >
      {items.map((item, i) => {
        if (item === 'divider') {
          return <div key={i} className="h-px bg-neutral-700 my-1" />;
        }
        
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              item.onClick();
            }}
            disabled={item.disabled}
            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between group transition-colors ${
                item.danger 
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                    : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-neutral-500 text-[10px] ml-4 font-mono">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
