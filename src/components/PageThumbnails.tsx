import React from 'react';
import { Document, Page } from 'react-pdf';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useProjectStore } from '../stores/projectStore';
import { Tooltip } from './Tooltip';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';

const IMAGE_TYPE_LABELS: Record<string, string> = {
  gallery: 'Gallery',
  floorPlan: 'Floor Plan',
  unitLocation: 'Location',
  paymentPlan: 'Payment Plan'
};

const ThumbnailItem = ({ page, index, isActive, isDragging, onDragStart, onDragOver, onDrop, onContextMenu, onSelect, fieldsCount, imageFields, placeholderHeight }: any) => {
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isActive && elementRef.current) {
             elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [isActive]);

    const renderContent = () => {
      if (page.type === 'pdf') {
        return (
          <button
            onClick={() => onSelect(index)}
            onContextMenu={(e) => onContextMenu(e, index)}
            className={`w-full relative rounded-md overflow-hidden transition-all mb-3 ${
              isActive
                ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900 shadow-lg shadow-primary-500/20'
                : 'hover:ring-2 hover:ring-neutral-500 hover:ring-offset-2 hover:ring-offset-neutral-900 opacity-80 hover:opacity-100'
            }`}
          >
            <Page
              pageNumber={page.pageNum}
              width={95}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            
            <div className={`absolute bottom-1 left-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-semibold rounded ${
              isActive ? 'bg-primary-500 text-neutral-900' : 'bg-neutral-900/80 text-neutral-300'
            }`}>
              {index + 1}
            </div>

            {(fieldsCount > 0) && (
              <div className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-blue-500/90 text-white text-[9px] font-semibold rounded-full">
                {fieldsCount}
              </div>
            )}
          </button>
        );
      }

      if (page.type === 'image') {
        const img = imageFields.find((i: any) => i.id === page.imageId);
        if (!img) return null;
        
        return (
          <button
            onClick={() => onSelect(index)}
            onContextMenu={(e) => onContextMenu(e, index)}
            className={`w-full rounded-md flex flex-col items-center justify-center gap-2 transition-all mb-3 relative overflow-hidden group ${
              isActive
                ? 'bg-neutral-800 ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900 shadow-lg'
                : 'bg-neutral-800/50 border border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-800'
            }`}
            style={{ height: placeholderHeight || 134 }} 
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />
            
            <div className={`absolute bottom-1 left-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-semibold rounded z-10 ${
              isActive ? 'bg-primary-500 text-neutral-900' : 'bg-neutral-900/80 text-neutral-300'
            }`}>
              {index + 1}
            </div>

            <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? 'bg-primary-500 text-neutral-900' : 'bg-neutral-700 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-neutral-200'
            }`}>
                {IMAGE_TYPE_LABELS[img.type] === 'Gallery' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {IMAGE_TYPE_LABELS[img.type] === 'Floor Plan' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                {IMAGE_TYPE_LABELS[img.type] === 'Location' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
            </div>

            <span className={`relative text-[9px] font-semibold tracking-wide uppercase ${
                isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-200'
            }`}>
              {IMAGE_TYPE_LABELS[img.type]}
            </span>
          </button>
        );
      }

      if (page.type === 'payment-plan') {
         // We might not find the plan if it was just deleted? 
         // But handling robustly:
         return (
          <button
            onClick={() => onSelect(index)}
            onContextMenu={(e) => onContextMenu(e, index)}
            className={`w-full rounded-md flex flex-col items-center justify-center gap-2 transition-all mb-3 relative overflow-hidden group ${
              isActive
                ? 'bg-neutral-800 ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900 shadow-lg'
                : 'bg-neutral-800/50 border border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-800'
            }`}
            style={{ height: placeholderHeight || 134 }} 
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />
            
            <div className={`absolute bottom-1 left-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-semibold rounded z-10 ${
              isActive ? 'bg-primary-500 text-neutral-900' : 'bg-neutral-900/80 text-neutral-300'
            }`}>
              {index + 1}
            </div>

            <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? 'bg-primary-500 text-neutral-900' : 'bg-neutral-700 text-neutral-400 group-hover:bg-neutral-600 group-hover:text-neutral-200'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <span className={`relative text-[9px] font-semibold tracking-wide uppercase ${
                isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-200'
            }`}>
              Payment Plan
            </span>
          </button>
         );
      }
      return null;
    };

    return (
        <div
            ref={elementRef}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={onDrop}
            className={`transition-all duration-200 ${isDragging ? 'opacity-0' : ''}`}
        >
          {renderContent()}
        </div>
    );
};

export function PageThumbnails() {
  const { templateId } = useParams<{ templateId: string }>();
  const templates = useProjectStore((state) => state.templates);
  const currentTemplate = templates.find(t => t.id === templateId);

  const { 
    pdfUrl, 
    pdfFile,
    textFields, 
    imageFields,
    currentVirtualPageIndex,
    setCurrentVirtualPageIndex,
    getVirtualPages,
    viewMode,
    setViewMode,
    pdfDimensions,
    setVirtualPages,
    duplicatePage,
    deletePage,
  } = useEditorStore();

  const storeVirtualPages = getVirtualPages();
  const [localPages, setLocalPages] = React.useState(storeVirtualPages);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  
  // Sync local pages with store when not dragging
  React.useEffect(() => {
    if (draggedIndex === null) {
      setLocalPages(storeVirtualPages);
    }
  }, [storeVirtualPages, draggedIndex]);

  // Calculate placeholder height based on PDF aspect ratio
  const placeholderHeight = pdfDimensions 
    ? 95 * (pdfDimensions.height / pdfDimensions.width)
    : 134; 

  // Count fields per page
  const fieldsPerPage = new Map<number, number>();
  textFields.forEach((f) => {
    const count = fieldsPerPage.get(f.page) || 0;
    fieldsPerPage.set(f.page, count + 1);
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Native ghost will appear, creating "in hand" effect
  };


  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Optimistic reorder
    const newPages = [...localPages];
    const [moved] = newPages.splice(draggedIndex, 1);
    newPages.splice(index, 0, moved);
    
    setLocalPages(newPages);
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      setVirtualPages(localPages);
    }
    setDraggedIndex(null);
  };

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; items: (ContextMenuItem | 'divider')[] } | null>(null);

  const handlePageContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the page first
    setCurrentVirtualPageIndex(index);

    setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
            { label: 'Duplicate Page', onClick: () => duplicatePage(index) },
            'divider',
            { label: 'Delete Page', onClick: () => deletePage(index), danger: true, disabled: storeVirtualPages.length <= 1 },
        ]
    });
  };

  // ... (useEffects and handlers)
  
  return (
    <div className="p-2 space-y-2 page-thumbnails relative">
      {/* Template Name */}
      {(currentTemplate || pdfFile) && (
        <div className="px-1 pb-2 border-b border-neutral-700/50">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5">Template</div>
          <Tooltip content={currentTemplate?.name || pdfFile?.name || ''} position="right">
            <div className="text-[11px] text-neutral-300 truncate font-medium cursor-help">
              {currentTemplate?.name || pdfFile?.name.replace('.pdf', '')}
            </div>
          </Tooltip>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="px-1 pb-2 border-b border-neutral-700/50">
        <div className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1.5">View</div>
        <div className="flex gap-2">
          <Tooltip content="Scroll through all pages">
            <button
              onClick={() => setViewMode('scroll')}
              className={`flex-1 p-1.5 rounded transition-all ${
                viewMode === 'scroll' 
                  ? 'bg-primary-500 text-neutral-900' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {/* Stacked Pages (Scroll) */}
              <svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content="Single page view">
            <button
              onClick={() => setViewMode('page')}
              className={`flex-1 p-1.5 rounded transition-all ${
                viewMode === 'page' 
                  ? 'bg-primary-500 text-neutral-900' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {/* Single Page */}
              <svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm14 3a1 1 0 00-1-1H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V6z" clipRule="evenodd" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="text-[9px] font-medium text-neutral-500 uppercase tracking-wider px-1">
        Pages ({localPages.length})
      </div>
      <Document file={pdfUrl}>
        {localPages.map((page, index) => (
            <ThumbnailItem 
                key={page.type === 'pdf' ? `pdf-${page.pageNum}-${index}` : (page.type === 'image' ? `img-${page.imageId}-${index}` : `pp-${page.planId}-${index}`)}
                page={page}
                index={index}
                isActive={currentVirtualPageIndex === index}
                isDragging={draggedIndex === index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onContextMenu={handlePageContextMenu}
                onSelect={setCurrentVirtualPageIndex}
                fieldsCount={page.type === 'pdf' ? fieldsPerPage.get(page.pageNum - 1) : 0}
                imageFields={imageFields}
                placeholderHeight={placeholderHeight}
            />
        ))}
      </Document>
      
      {contextMenu && (
        <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            items={contextMenu.items} 
            onClose={() => setContextMenu(null)} 
        />
      )}
    </div>
  );
}
