import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: -9999, left: -9999 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current.offsetHeight;
        const tooltipWidth = tooltipRef.current.offsetWidth;
        
        // If tooltip hasn't rendered yet, wait a bit
        if (tooltipWidth === 0 || tooltipHeight === 0) {
          setTimeout(updatePosition, 10);
          return;
        }
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 8; // Padding from viewport edges
        
        let top = 0;
        let left = 0;
        let transform = '';
        
        switch (position) {
            case 'right':
                left = rect.right + 8;
                top = rect.top + rect.height / 2;
                transform = 'translateY(-50%)';
                
                // Overflow check
                if (left + tooltipWidth + padding > viewportWidth) {
                    left = rect.left - tooltipWidth - 8; // Flip to left
                }
                break;
            case 'left':
                left = rect.left - tooltipWidth - 8;
                top = rect.top + rect.height / 2;
                transform = 'translateY(-50%)';
                
                // Overflow check
                if (left < padding) {
                    left = rect.right + 8; // Flip to right
                }
                break;
            case 'top':
                top = rect.top - tooltipHeight - 8;
                left = rect.left + rect.width / 2;
                transform = 'translateX(-50%)';
                
                if (top < padding) {
                    top = rect.bottom + 8; // Flip to bottom
                }
                break;
            case 'bottom':
            default:
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
                transform = 'translateX(-50%)';
                
                if (top + tooltipHeight + padding > viewportHeight) {
                    top = rect.top - tooltipHeight - 8; // Flip to top
                }
                break;
        }

        // Adjust perpendicular axis to prevent overflow
        if (position === 'left' || position === 'right') {
             // Check vertical overflow
             const halfHeight = tooltipHeight / 2;
             if (top - halfHeight < padding) {
                 top = padding + halfHeight;
             } else if (top + halfHeight > viewportHeight - padding) {
                 top = viewportHeight - padding - halfHeight;
             }
        } else {
             // Check horizontal overflow
             const halfWidth = tooltipWidth / 2;
             if (left - halfWidth < padding) {
                 left = padding + halfWidth;
             } else if (left + halfWidth > viewportWidth - padding) {
                 left = viewportWidth - padding - halfWidth;
             }
        }
        
        setTooltipPosition({ top, left });
        if (tooltipRef.current) {
            tooltipRef.current.style.transform = transform;
        }
      };

      // Wait for tooltip to render, then calculate position
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePosition);
      });

      // Also update on window resize
      const handleResize = () => {
        updatePosition();
      };
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, position, content]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`
            fixed z-[99999]
            px-2 py-1 text-[11px] font-medium text-white 
            bg-neutral-900 border border-neutral-700 rounded-md shadow-lg
            whitespace-nowrap pointer-events-none
            transition-opacity duration-150
          `}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            // transform is set via ref in effect to handle dynamic changes simpler
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
