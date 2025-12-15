import { useState, useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import { replacePlaceholders } from "../utils/dummyData";
import type { EditorTextField } from "../types";

interface TextFieldProps {
  field: EditorTextField;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  pageHeight: number;
  zoom: number;
}

interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number; // Screen coordinate
}

export function TextField({ field, isSelected, onSelect, pageHeight, zoom }: TextFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPositions, setInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  
  const hasSavedHistory = useRef(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const cachedTargets = useRef<{ id: string; x: number; y: number; width: number; height: number }[]>([]);

  const { 
    updateTextField, 
    pdfDimensions, 
    saveToHistory, 
    selectedFieldIds, 
    textFields, 
    activeTool, 
    showVariables,
    snapEnabled 
  } = useEditorStore();

  // Convert PDF coordinates (Y from bottom) to screen coordinates (Y from top)
  const screenY = pageHeight - field.y;
  const screenX = field.isHorizontallyCentered && pdfDimensions ? pdfDimensions.width / 2 : field.x;

  const previewText = replacePlaceholders(field.content);


  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Allow panning (bubbling) if hand tool is active
      if (activeTool === 'hand') return;

      e.stopPropagation();
      e.preventDefault(); // Prevent text selection

      // Handle selection
      if (e.shiftKey) {
        onSelect(true); // Add to selection
        return; // Don't start dragging when shift-clicking
      } else if (!isSelected) {
        onSelect(false); // Replace selection
      }

      // Start dragging (only if not shift-clicking)
      if (fieldRef.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });

        // Cache positions of ALL other fields for snapping (using DOM for accuracy)
        const targets = textFields
          .filter(f => f.id !== field.id && !selectedFieldIds.includes(f.id) && f.page === field.page)
          .map(f => {
            const el = document.getElementById(`field-${f.id}`);
            if (el) {
                const r = el.getBoundingClientRect();
                // r.width and r.height are impacted by CSS zoom on the container!
                // We must un-zoom them to match the coordinate system of x/y
                const width = r.width / zoom;
                const height = r.height / zoom;
                
                return {
                    id: f.id,
                    left: f.isHorizontallyCentered && pdfDimensions ? pdfDimensions.width / 2 - width/2 : f.x,
                    width: width,
                    right: (f.isHorizontallyCentered && pdfDimensions ? pdfDimensions.width / 2 - width/2 : f.x) + width,
                    top: pageHeight - f.y, // Relative to page container top
                    height: height,
                    bottom: (pageHeight - f.y) + height,
                    centerX: (f.isHorizontallyCentered && pdfDimensions ? pdfDimensions.width / 2 : f.x) + width/2,
                    centerY: (pageHeight - f.y) + height/2
                };
            }
            return null;
          })
          .filter((t): t is NonNullable<typeof t> => t !== null);
          
        cachedTargets.current = targets as any;

        // Store initial positions of all selected fields (if multiple selected)
        if (selectedFieldIds.length > 1) {
          const positions = new Map<string, { x: number; y: number }>();
          const selectedFields = textFields.filter((f) => selectedFieldIds.includes(f.id));
          selectedFields.forEach((f) => {
            positions.set(f.id, { x: f.x, y: f.y });
          });
          setInitialPositions(positions);
        } else {
          setInitialPositions(new Map());
        }

        setIsDragging(true);
        hasSavedHistory.current = false;
      }
    },
    [onSelect, isSelected, saveToHistory, selectedFieldIds, textFields, field.id, field.page, pageHeight, pdfDimensions, activeTool]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const container = fieldRef.current?.closest(".relative");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const currentRect = fieldRef.current?.getBoundingClientRect();
      const currentWidth = currentRect?.width || 0;
      const currentHeight = currentRect?.height || 0;

      // Calculate raw new position (Top-Left relative to Page)
      let newLeft = (e.clientX - containerRect.left) / zoom - dragOffset.x / zoom;
      let newTop = (e.clientY - containerRect.top) / zoom - dragOffset.y / zoom;

      // Snapping Logic
      const newGuides: SnapGuide[] = [];
      const isSnapDisabled = e.ctrlKey || e.metaKey || !snapEnabled;

      if (!isSnapDisabled) {
        const SNAP_THRESHOLD = 5;
        let snappedX = false;
        let snappedY = false;

        const myRight = newLeft + currentWidth;
        const myBottom = newTop + currentHeight;
        const myCenterX = newLeft + currentWidth / 2;
        const myCenterY = newTop + currentHeight / 2;

        // Iterate through valid targets
        // We cast cachedTargets to the type we stored
        const targets = cachedTargets.current as any[];

        for (const target of targets) {
          // Vertical Alignments (Xs)
          // 1. Left to Left
          if (!snappedX && Math.abs(newLeft - target.left) < SNAP_THRESHOLD) {
            newLeft = target.left; snappedX = true; newGuides.push({ type: 'vertical', position: target.left });
          }
          // 2. Left to Right
          if (!snappedX && Math.abs(newLeft - target.right) < SNAP_THRESHOLD) {
            newLeft = target.right; snappedX = true; newGuides.push({ type: 'vertical', position: target.right });
          }
          // 3. Right to Left
          if (!snappedX && Math.abs(myRight - target.left) < SNAP_THRESHOLD) {
            newLeft = target.left - currentWidth; snappedX = true; newGuides.push({ type: 'vertical', position: target.left });
          }
          // 4. Right to Right
          if (!snappedX && Math.abs(myRight - target.right) < SNAP_THRESHOLD) {
            newLeft = target.right - currentWidth; snappedX = true; newGuides.push({ type: 'vertical', position: target.right });
          }
          // 5. Center to Center
          if (!snappedX && Math.abs(myCenterX - target.centerX) < SNAP_THRESHOLD) {
            newLeft = target.centerX - currentWidth / 2; snappedX = true; newGuides.push({ type: 'vertical', position: target.centerX });
          }

          // Horizontal Alignments (Ys)
          // 1. Top to Top
          if (!snappedY && Math.abs(newTop - target.top) < SNAP_THRESHOLD) {
             newTop = target.top; snappedY = true; newGuides.push({ type: 'horizontal', position: target.top });
          }
          // 2. Top to Bottom
          if (!snappedY && Math.abs(newTop - target.bottom) < SNAP_THRESHOLD) {
             newTop = target.bottom; snappedY = true; newGuides.push({ type: 'horizontal', position: target.bottom });
          }
           // 3. Bottom to Top
          if (!snappedY && Math.abs(myBottom - target.top) < SNAP_THRESHOLD) {
             newTop = target.top - currentHeight; snappedY = true; newGuides.push({ type: 'horizontal', position: target.top });
          }
          // 4. Bottom to Bottom
          if (!snappedY && Math.abs(myBottom - target.bottom) < SNAP_THRESHOLD) {
             newTop = target.bottom - currentHeight; snappedY = true; newGuides.push({ type: 'horizontal', position: target.bottom });
          }
          // 5. Center to Center
          if (!snappedY && Math.abs(myCenterY - target.centerY) < SNAP_THRESHOLD) {
             newTop = target.centerY - currentHeight / 2; snappedY = true; newGuides.push({ type: 'horizontal', position: target.centerY });
          }
        }
      }

      setActiveGuides(newGuides);

      // Save history on first actual move
      if (!hasSavedHistory.current) {
        saveToHistory();
        hasSavedHistory.current = true;
      }

      // Convert Screen Top back to PDF Y (Bottom-up)
      // Screen Top = newTop. 
      // PDF Y = PageHeight - newTop.
      const newPdfY = pageHeight - newTop;

      // Get PDF dimensions for clamping
      const pdfWidth = pdfDimensions?.width || 595;

      // If multiple fields are selected, move all of them together
      if (initialPositions.size > 1) {
        const initialPos = initialPositions.get(field.id);
        if (!initialPos) return;

        const deltaX = newLeft - initialPos.x;
        const deltaY = newPdfY - initialPos.y;

        initialPositions.forEach((startPos, fieldId) => {
          const newX = startPos.x + deltaX;
          const newY = startPos.y + deltaY;

          updateTextField(fieldId, {
            x: Math.round(Math.max(3, Math.min(newX, pdfWidth))),
            y: Math.round(Math.max(35, Math.min(newY, pageHeight))),
            isHorizontallyCentered: false,
          });
        });
      } else {
        const clampedX = Math.max(3, Math.min(newLeft, pdfWidth));
        const clampedY = Math.max(35, Math.min(newPdfY, pageHeight));

        updateTextField(field.id, {
          x: Math.round(clampedX),
          y: Math.round(clampedY),
          isHorizontallyCentered: false,
        });
      }
    },
    [isDragging, dragOffset, zoom, pageHeight, field.id, updateTextField, pdfDimensions, initialPositions, saveToHistory, snapEnabled]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setInitialPositions(new Map());
    setActiveGuides([]); // Clear guides
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Alignment Guides */}
      {isDragging && activeGuides.map((guide, i) => (
         <div
           key={i}
           className="absolute bg-cyan-400 z-[60] pointer-events-none"
           style={{
             left: guide.type === 'vertical' ? guide.position - screenX : -1000, 
             top: guide.type === 'horizontal' ? guide.position - screenY : -1000,
             width: guide.type === 'vertical' ? '1px' : '200vw',
             height: guide.type === 'horizontal' ? '1px' : '200vh',
             // Translate to be global-ish?
             // guide.position is relative to PAGE Top/Left.
             // This div is at `screenX, screenY` relative to Page.
             // So `left: guide.pos - screenX` puts it at guide.pos relative to Page. Correct.
             marginLeft: guide.type === 'vertical' ? 0 : '-100vw',
             marginTop: guide.type === 'horizontal' ? 0 : '-100vh',
           }}
        >
            <div className={`w-full h-full border-cyan-500 border-dashed opacity-80 ${guide.type==='vertical'?'border-l':'border-t'}`} /> 
        </div>
      ))}

        <div
            id={`field-${field.id}`}
            ref={fieldRef}

            className={`text-field absolute ${activeTool === 'hand' ? '' : 'cursor-move'} select-none whitespace-nowrap ${isDragging ? "z-50" : "z-10"}`}
            style={{
                left: screenX,
                top: screenY,
                fontSize: field.size,
                transform: field.isHorizontallyCentered ? "translateX(-50%)" : "none",
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
        {/* Always visible background for editor */}
        <div className={`absolute -inset-1 rounded pointer-events-none transition-all ${isSelected ? "border-2 border-primary-500 bg-primary-500/20" : "border border-dashed border-blue-400/50 bg-blue-500/10 hover:bg-blue-500/20"}`} />

        {/* Drag handle indicator */}
        {isSelected && (
            <>
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary-500 rounded-full pointer-events-none border-2 border-white shadow" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary-500 rounded-full pointer-events-none border-2 border-white shadow" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary-500 rounded-full pointer-events-none border-2 border-white shadow" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary-500 rounded-full pointer-events-none border-2 border-white shadow" />
            </>
        )}

        {/* Text content with visible styling */}
        <span className="relative z-10 px-1" style={{ color: field.color }}>
            {previewText}
        </span>

        {/* Coordinate label when selected */}
        {isSelected && (
            <div 
                className={`absolute left-0 text-[10px] text-primary-500 font-mono whitespace-nowrap bg-neutral-900/90 px-1.5 py-0.5 rounded ${
                    field.y < 100 ? '-top-6' : '-bottom-6'
                }`}
            >
            x:{Math.round(field.x)} y:{Math.round(field.y)}
            </div>
        )}

        {/* Variable Peek Overlay */}
        <div
            className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 shadow-xl pointer-events-none transition-all duration-200 ${
            showVariables ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
            }`}
        >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">VAR</span>
            <code className="text-xs font-mono text-neutral-200 bg-neutral-900/50 px-1 rounded">
                {field.requires || field.content}
            </code>
            </div>
            {/* Little arrow pointing to field */}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-800 border-l border-b border-neutral-700 transform rotate-45" />
        </div>
        </div>
    </>
  );
}
