import { useRef, useCallback, useState } from 'react';

interface ResizeHandleProps {
  value: number;
  onChange: (value: number) => void;
  direction: 'horizontal' | 'vertical';
  min?: number;
  max?: number;
  inverse?: boolean;
  className?: string;
}

export function ResizeHandle({ 
  value, 
  onChange, 
  direction, 
  min = 0, 
  max = Infinity, 
  inverse = false, 
  className = '' 
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startValueRef = useRef(0);

  // We need to keep a ref to the latest props to use in the event listener
  // without re-binding it constantly, although with the new logic
  // we capture startValue at mousedown, so it should be fine.

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startValueRef.current = value;
    
    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const diff = currentPos - startPosRef.current;
      
      // Calculate new value
      let newValue = inverse 
        ? startValueRef.current - diff 
        : startValueRef.current + diff;
      
      // Clamp
      newValue = Math.max(min, Math.min(max, newValue));
      
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, onChange, value, min, max, inverse]);

  const cursorClass = direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize';
  const sizeClass = direction === 'horizontal' ? 'w-4 hover:w-4 -ml-2' : 'h-4 hover:h-4 -mt-2'; // Expanded hit area

  return (
    <div
      className={`${cursorClass} ${className} flex items-center justify-center transition-colors group relative z-50`}
      onMouseDown={handleMouseDown}
    >
        {/* Invisible expanded hit area */}
        <div className={`absolute ${sizeClass} z-50`} />

        {/* Visible line */}
        <div className={`
            ${direction === 'horizontal' ? 'w-1 h-full' : 'h-1 w-full'} 
            bg-neutral-800 group-hover:bg-primary-500/50 transition-colors
            ${isDragging ? 'bg-primary-500' : ''}
        `} />
        
        {/* Handle indicator (dots/pill) */}
        <div className={`absolute bg-neutral-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
            ${isDragging ? 'opacity-100 bg-primary-500' : ''}
            ${direction === 'horizontal' ? 'w-1 h-8' : 'h-1 w-8'}
        `} />
    </div>
  );
}





