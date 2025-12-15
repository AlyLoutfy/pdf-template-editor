import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { useEditorStore } from "../stores/editorStore";
import { TextField } from "./TextField";
import { AddVariableMenu } from "./AddVariableMenu";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuItem } from "./ContextMenu";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
// ... (rest of imports)

// ... (inside PdfViewer body, before return)

// ... (rest of imports)

const IMAGE_TYPE_LABELS: Record<string, string> = {
  gallery: "Offer Gallery",
  floorPlan: "Floor Plans",
  unitLocation: "Unit Location",
};

const IMAGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  gallery: "Property gallery images will be inserted here",
  floorPlan: "Floor plan images will be inserted here",
  unitLocation: "Unit location map will be inserted here",
};

const PAGE_GAP = 24; // Gap between pages in pixels

export function PdfViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [selectionPage, setSelectionPage] = useState<number | null>(null);
  
  // Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollTop: 0, scrollLeft: 0 });

  const { 
    pdfUrl, currentPage, setCurrentPage, setCurrentVirtualPageIndex, zoom, setZoom, 
    setNumPages, setPdfDimensions, textFields, imageFields, selectedFieldIds, activeTool, 
    addTextField, selectField, selectFields, clearSelection, pdfDimensions, getVirtualPages, 
    viewMode, numPages, currentVirtualPageIndex,
    duplicateSelected, deleteSelected, copyStyles, pasteStyles, addPreset
  } = useEditorStore();

  const virtualPages = getVirtualPages();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: (ContextMenuItem | 'divider')[] } | null>(null);

  const handleFieldContextMenu = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the field if not already selected
    if (!selectedFieldIds.includes(fieldId)) {
        selectField(fieldId);
    }
    
    const handleSavePreset = () => {
        const name = window.prompt("Enter name for new preset:");
        if (!name) return;
        
        // Find the context field to know which page we are on
        const contextField = textFields.find(f => f.id === fieldId);
        if (!contextField) return;
        
        // Get all selected fields that are on the same page
        const fieldsToSave = textFields.filter(f => 
            selectedFieldIds.includes(f.id) && f.page === contextField.page
        );
        
        if (fieldsToSave.length === 0) return;
        
        // Clone fields for the preset (clean IDs, set page to 0)
        const presetFields = fieldsToSave.map(f => ({
            ...f,
            id: Math.random().toString(36).substring(2, 11), // New ID
            page: 0 // Normalize to page 0
        }));
        
        addPreset({
            id: Math.random().toString(36).substring(2, 11),
            name,
            fields: presetFields
        });
    };

    setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
            { label: 'Copy Styles', onClick: copyStyles, shortcut: '⌘C' },
            { label: 'Paste Styles', onClick: pasteStyles, shortcut: '⌘V' },
            'divider',
            { label: 'Save as Preset', onClick: handleSavePreset },
            'divider',
            { label: 'Duplicate', onClick: duplicateSelected, shortcut: '⌘D' },
            'divider',
            { label: 'Delete', onClick: deleteSelected, shortcut: '⌫', danger: true },
        ]
    });
  }, [selectedFieldIds, selectField, copyStyles, pasteStyles, duplicateSelected, deleteSelected, textFields, addPreset]);


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const [hasAutoFit, setHasAutoFit] = useState(false);

  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    // Update store with PDF dimensions
    setPdfDimensions({ width: page.width, height: page.height });

    // Auto-fit logic loops:
    // Only run if we haven't auto-fitted this document yet, OR if zoom is at default 1.0 (fresh load)
    if (containerRef.current && (!hasAutoFit || zoom === 1)) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const padding = 64; // 32px padding on each side
      
      const availableWidth = containerRect.width - padding;
      const availableHeight = containerRect.height - padding;

      // Calculate ratios to fit the page completely
      const widthRatio = availableWidth / page.width;
      const heightRatio = availableHeight / page.height;

      // Use the smaller ratio to ensure full visibility (contain)
      const fitZoom = Math.min(widthRatio, heightRatio);
      
      // Clamp reasonable values (e.g. don't zoom out to 10% or in to 500% automatically)
      // And round to 2 decimal places for cleanliness
      const roundedZoom = Math.round(Math.max(0.2, Math.min(1.5, fitZoom)) * 100) / 100;

      if (roundedZoom > 0 && Math.abs(roundedZoom - zoom) > 0.05) {
        setZoom(roundedZoom);
      }
      setHasAutoFit(true);
    }
  };

  // Reset auto-fit flag when PDF URL changes
  useEffect(() => {
    setHasAutoFit(false);
  }, [pdfUrl]);

  const virtualPageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isProgrammaticScroll = useRef(false);
  const isUpdatingFromScroll = useRef(false);

  // Track current page index in a ref to avoid re-binding scroll listener constantly
  const pageIndexRef = useRef(currentVirtualPageIndex);
  useEffect(() => {
    pageIndexRef.current = currentVirtualPageIndex;
  }, [currentVirtualPageIndex]);

  // Track current page based on scroll position (only in scroll mode)
  useEffect(() => {
    if (viewMode !== "scroll") return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      const containerRect = container.getBoundingClientRect();

      let mostVisibleVirtualIndex = pageIndexRef.current;
      let maxVisibility = 0;

      // Use Array.from to iterate safely
      const entries = Array.from(virtualPageRefs.current.entries());
      
      entries.forEach(([vIndex, pageEl]) => {
        if (!pageEl) return;
        const pageRect = pageEl.getBoundingClientRect();
        
        // Calculate intersection with container
        const intersectionTop = Math.max(containerRect.top, pageRect.top);
        const intersectionBottom = Math.min(containerRect.bottom, pageRect.bottom);
        const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);
        
        const visibility = intersectionHeight; 

        if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleVirtualIndex = vIndex;
        }
      });
      
      const closestVirtualIndex = mostVisibleVirtualIndex;

      if (closestVirtualIndex !== pageIndexRef.current) {
         isUpdatingFromScroll.current = true;
         setCurrentVirtualPageIndex(closestVirtualIndex);
         
         // Update ref immediately to prevent duplicate updates before render cycle completes
         pageIndexRef.current = closestVirtualIndex;

         // If it's a PDF page, update currentPage too
         const vPage = virtualPages[closestVirtualIndex];
         if (vPage && vPage.type === 'pdf') {
           setCurrentPage(vPage.pageNum);
         }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [viewMode, virtualPages, setCurrentPage, setCurrentVirtualPageIndex]); // Removed currentVirtualPageIndex from deps

  // Programmatic Scroll Effect
  useEffect(() => {
    if (viewMode !== 'scroll') return;
    
    // Ignore updates that came from the scroll listener
    if (isUpdatingFromScroll.current) {
        isUpdatingFromScroll.current = false;
        return;
    }
    
    // Check if the target page is already visible
    const container = containerRef.current;
    const targetEl = virtualPageRefs.current.get(currentVirtualPageIndex);
    
    if (container && targetEl) {
       const containerRect = container.getBoundingClientRect();
       const targetRect = targetEl.getBoundingClientRect();
       
       // Force scroll unless the page is strictly at the top of the container
       // This ensures that even if a page is "visible" (e.g. page 2 at bottom of page 1),
       // we still scroll it to the top so it becomes the active/dominant page.
       const isAtTop = Math.abs(targetRect.top - containerRect.top) < 20;
       
       if (!isAtTop) {
         isProgrammaticScroll.current = true;
         targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
         
         // Release lock after animation
         setTimeout(() => {
           isProgrammaticScroll.current = false;
         }, 800);
       }
    }
  }, [currentVirtualPageIndex, viewMode]);

  // Pending addition state (for smart menu)
  const [pendingAdd, setPendingAdd] = useState<{ page: number; x: number; y: number; clickX: number; clickY: number } | null>(null);

  // Handle click on PDF to add text field
  const handlePdfClick = useCallback(
    (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== "text") return;

      const pageEl = pageRefs.current.get(pageNum);
      if (!pageEl) return;

      const rect = pageEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert screen coordinates to PDF coordinates (accounting for zoom)
      const pdfX = clickX / zoom;
      const pdfY_screen = clickY / zoom;

      // PDF Y is from bottom, screen Y is from top
      const pageHeight = pdfDimensions?.height || 842;
      const pdfY = pageHeight - pdfY_screen;

      // Clamp to PDF bounds
      const clampedX = Math.max(0, Math.min(pdfX, pdfDimensions?.width || 595));
      const clampedY = Math.max(10, Math.min(pdfY, pageHeight));

      // Open the smart menu at the click location
      setPendingAdd({
        page: pageNum,
        x: Math.round(clampedX),
        y: Math.round(clampedY),
        clickX: e.clientX, // Global coordinates for menu positioning if needed, typically we use absolute inside relative container
        clickY: e.clientY
      });
    },
    [activeTool, zoom, pdfDimensions]
  );
  
  const handleVariableSelect = (variable: string) => {
    if (!pendingAdd) return;

    addTextField({
      id: Math.random().toString(36).substring(2, 11),
      page: pendingAdd.page - 1, // 0-indexed
      content: variable === 'Custom Text' ? 'New Text' : variable,
      x: pendingAdd.x,
      y: pendingAdd.y,
      size: 20, // Default size
      color: "#000000",
      isHorizontallyCentered: false,
      isFullNumber: false,
      // Auto-set requires for variables
      requires: variable !== 'Custom Text' ? variable : undefined
    });
    
    setPendingAdd(null);
    // Switch back to select tool for better UX? Or keep adding? User asked to "not have to change cursor", implied smoother flow. 
    // Usually keep 'text' tool active is standard, but maybe select after efficient add is better. 
    // Let's keep 'text' tool active for now unless requested.
    useEditorStore.getState().setActiveTool('select');
  };

  // Selection box for multi-select
  const handleMouseDown = useCallback(
    (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== "select") return;

      // Don't start selection if clicking on a text field
      if ((e.target as HTMLElement).closest(".text-field")) return;

      const pageEl = pageRefs.current.get(pageNum);
      if (!pageEl) return;

      const rect = pageEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      // Only clear selection if not holding shift
      if (!e.shiftKey) {
        clearSelection();
      }

      setIsSelecting(true);
      setSelectionPage(pageNum);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
    },
    [activeTool, clearSelection, zoom]
  );

  const handleMouseMove = useCallback(
    (pageNum: number, e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting || selectionPage !== pageNum) return;

      const pageEl = pageRefs.current.get(pageNum);
      if (!pageEl) return;

      const rect = pageEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      setSelectionEnd({ x, y });
    },
    [isSelecting, selectionPage, zoom]
  );

  const handleMouseUp = useCallback(
    (pageNum: number) => {
      if (!isSelecting || selectionPage !== pageNum) {
        setIsSelecting(false);
        setSelectionPage(null);
        return;
      }

      // Calculate selection box bounds
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      // Only select if the box is big enough
      if (maxX - minX < 5 && maxY - minY < 5) {
        setIsSelecting(false);
        setSelectionPage(null);
        return;
      }

      const pageHeight = pdfDimensions?.height || 842;
      const fieldsOnPage = textFields.filter((f) => f.page === pageNum - 1);

      // Find fields within selection box
      const selectedIds = fieldsOnPage
        .filter((field) => {
          const fieldX = field.isHorizontallyCentered && pdfDimensions ? pdfDimensions.width / 2 : field.x;
          const fieldY = pageHeight - field.y;
          return fieldX >= minX && fieldX <= maxX && fieldY >= minY && fieldY <= maxY;
        })
        .map((f) => f.id);

      if (selectedIds.length > 0) {
        selectFields(selectedIds);
      }

      setIsSelecting(false);
      setSelectionPage(null);
    },
    [isSelecting, selectionPage, selectionStart, selectionEnd, textFields, selectFields, pdfDimensions]
  );

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Don't deselect if clicking in field editor or toolbar or page thumbnails
        if ((e.target as HTMLElement).closest(".field-editor")) return;
        if ((e.target as HTMLElement).closest(".toolbar")) return;
        if ((e.target as HTMLElement).closest(".page-thumbnails")) return;
        if ((e.target as HTMLElement).closest(".context-menu")) return;
        clearSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSelection]);

  const getSelectionBox = (pageNum: number) => {
    if (!isSelecting || selectionPage !== pageNum) return null;
    return {
      left: Math.min(selectionStart.x, selectionEnd.x),
      top: Math.min(selectionStart.y, selectionEnd.y),
      width: Math.abs(selectionEnd.x - selectionStart.x),
      height: Math.abs(selectionEnd.y - selectionStart.y),
    };
  };

  // Panning Handlers
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'hand' || !containerRef.current) return;
    
    // Don't start panning if clicking on a control or interactive element
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.text-field')) return;

    e.preventDefault();
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollTop: containerRef.current.scrollTop,
      scrollLeft: containerRef.current.scrollLeft,
    });
  }, [activeTool]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    containerRef.current.scrollTop = panStart.scrollTop - dy;
    containerRef.current.scrollLeft = panStart.scrollLeft - dx;
  }, [isPanning, panStart]);

  const handleContainerMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Render a single PDF page with its overlays
  const renderPdfPage = (pageNum: number) => {
    const fieldsOnPage = textFields.filter((f) => f.page === pageNum - 1);
    const selectionBox = getSelectionBox(pageNum);

    return (
      <div
        key={`pdf-page-${pageNum}`}
        ref={(el) => {
          if (el) pageRefs.current.set(pageNum, el);
        }}
        className={`relative ${
          activeTool === "text" 
            ? "cursor-crosshair" 
            : activeTool === "hand"
            ? (isPanning ? "cursor-grabbing" : "cursor-grab")
            : "cursor-default"
        }`}
        onClick={(e) => handlePdfClick(pageNum, e)}
        onMouseDown={(e) => handleMouseDown(pageNum, e)}
        onMouseMove={(e) => handleMouseMove(pageNum, e)}
        onMouseUp={() => handleMouseUp(pageNum)}
        onMouseLeave={() => {
          if (selectionPage === pageNum) {
            setIsSelecting(false);
            setSelectionPage(null);
          }
        }}
      >
        <Page pageNumber={pageNum} onLoadSuccess={pageNum === 1 ? onPageLoadSuccess : undefined} renderTextLayer={false} renderAnnotationLayer={false} />

        {/* Text Fields Overlay */}
        {fieldsOnPage.map((field) => (
          <div 
            key={field.id} 
            className="absolute" 
            style={{ left: 0, top: 0, width: 0, height: 0 }} /* Zero size wrapper to not affect layout */
            onContextMenu={(e) => handleFieldContextMenu(e, field.id)}
          >
             <TextField field={field} isSelected={selectedFieldIds.includes(field.id)} onSelect={(addToSelection) => selectField(field.id, addToSelection)} pageHeight={pdfDimensions?.height || 842} zoom={zoom} />
          </div>
        ))}

        {/* Selection Box */}
        {selectionBox && selectionBox.width > 5 && selectionBox.height > 5 && (
          <div
            className="absolute border-2 border-primary-500 bg-primary-500/10 pointer-events-none"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </div>
    );
  };

  // Render image placeholder page
  const renderImagePage = (imageId: string) => {
    const image = imageFields.find((img) => img.id === imageId);
    if (!image) return null;

    return (
      <div
        key={`image-page-${imageId}`}
        className="bg-white rounded-lg flex flex-col items-center justify-center shadow-2xl"
        style={{
          width: pdfDimensions?.width || 595,
          height: pdfDimensions?.height || 842,
        }}
      >
        <div className="text-center max-w-md px-8">
          {/* Large icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center shadow-lg">
            {image.type === "gallery" ? (
              <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : image.type === "floorPlan" ? (
              <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 mb-2">{IMAGE_TYPE_LABELS[image.type]}</h2>
          <p className="text-sm text-neutral-500 mb-4">{IMAGE_TYPE_DESCRIPTIONS[image.type]}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs text-neutral-600 font-mono">{image.var}</div>
        </div>
      </div>
    );
  };

  // PAGE MODE - single page view with navigation
  if (viewMode === "page") {
    const currentVPage = virtualPages[currentVirtualPageIndex];
    const isImagePage = currentVPage?.type === "image";
    const fieldsOnCurrentPage = textFields.filter((f) => f.page === currentPage - 1);

    return (
      <div 
        ref={containerRef} 
        className={`h-full flex flex-col items-center justify-start p-8 overflow-auto ${activeTool === 'hand' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="w-[595px] h-[842px] bg-neutral-800 animate-pulse flex items-center justify-center rounded-lg">
                <svg className="w-8 h-8 text-neutral-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            }
          >
            {isImagePage ? (
              <div className="shadow-2xl rounded-lg overflow-hidden">{renderImagePage(currentVPage.imageId!)}</div>
            ) : (
              <div
                ref={(el) => {
                  if (el) pageRefs.current.set(currentPage, el);
                }}
                className={`relative shadow-2xl rounded-lg overflow-hidden ${
                  activeTool === "text" 
                    ? "cursor-crosshair" 
                    : activeTool === "hand"
                    ? (isPanning ? "cursor-grabbing" : "cursor-grab")
                    : "cursor-default"
                }`}
                onClick={(e) => handlePdfClick(currentPage, e)}
                onMouseDown={(e) => handleMouseDown(currentPage, e)}
                onMouseMove={(e) => handleMouseMove(currentPage, e)}
                onMouseUp={() => handleMouseUp(currentPage)}
                onMouseLeave={() => {
                  setIsSelecting(false);
                  setSelectionPage(null);
                }}
              >
                <Page pageNumber={currentPage} onLoadSuccess={onPageLoadSuccess} renderTextLayer={false} renderAnnotationLayer={false} />

                {/* Text Fields Overlay */}
                {fieldsOnCurrentPage.map((field) => (
                  <TextField key={field.id} field={field} isSelected={selectedFieldIds.includes(field.id)} onSelect={(addToSelection) => selectField(field.id, addToSelection)} pageHeight={pdfDimensions?.height || 842} zoom={zoom} />
                ))}

                {/* Selection Box */}
                {getSelectionBox(currentPage) && (
                  <div
                    className="absolute border-2 border-primary-500 bg-primary-500/10 pointer-events-none"
                    style={{
                      left: getSelectionBox(currentPage)!.left,
                      top: getSelectionBox(currentPage)!.top,
                      width: getSelectionBox(currentPage)!.width,
                      height: getSelectionBox(currentPage)!.height,
                    }}
                  />
                )}
              </div>
            )}
          </Document>

          {/* Page navigation controls */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={() => {
                if (currentVirtualPageIndex > 0) {
                  setCurrentVirtualPageIndex(currentVirtualPageIndex - 1);
                }
              }}
              disabled={currentVirtualPageIndex === 0}
              className="p-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-sm text-neutral-400 min-w-[80px] text-center">
              Page {currentPage} of {numPages}
            </div>
            
            <button
              onClick={() => {
                if (currentVirtualPageIndex < virtualPages.length - 1) {
                  setCurrentVirtualPageIndex(currentVirtualPageIndex + 1);
                }
              }}
              disabled={currentVirtualPageIndex >= virtualPages.length - 1}
              className="p-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCROLL MODE - all pages stacked vertically
  return (
    <div className="h-full flex flex-col relative bg-neutral-900/50">
      {/* Main Canvas Scroll Area */}
      <div 
        ref={containerRef} 
        className={`flex-1 overflow-auto p-8 relative ${activeTool === 'hand' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >
        <div
          className="flex flex-col items-center relative"
          style={{
            zoom: zoom,
            gap: PAGE_GAP,
            minWidth: 'fit-content', // Ensure container grows
            minHeight: 'fit-content'
          } as React.CSSProperties}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="w-[595px] h-[842px] bg-neutral-800 animate-pulse flex items-center justify-center rounded-lg">
                <svg className="w-8 h-8 text-neutral-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            }
          >
            {virtualPages.map((vPage, index) => (
              <div 
                key={index} 
                ref={(el) => {
                  if (el) virtualPageRefs.current.set(index, el);
                }}
                style={{ marginTop: index > 0 ? PAGE_GAP : 0 }} 
                className="relative group"
              >
                {/* Separator line between pages */}
                {index > 0 && (
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-32 h-px bg-neutral-600" />
                  </div>
                )}
                
                  {/* Visual page number for scroll mode */}
                  {viewMode === 'scroll' && vPage.type === 'pdf' && (
                    <div className={`absolute ${vPage.pageNum === 1 ? 'top-0' : 'top-4'} -right-6 flex flex-col items-center gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none`}>
                      <span className="text-[10px] font-bold text-neutral-500 writing-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '2px' }}>PAGE</span>
                      <span className="text-xl font-bold text-neutral-300">{vPage.pageNum}</span>
                    </div>
                  )}
                  
                  <div className="shadow-2xl rounded-lg overflow-hidden">
                    {vPage.type === "pdf" ? renderPdfPage(vPage.pageNum) : renderImagePage(vPage.imageId!)}
                  </div>

                  {/* Render Menu relative to the PAGE if pending add is on this page */}
                  {pendingAdd && vPage.type === 'pdf' && pendingAdd.page === vPage.pageNum && (
                   <AddVariableMenu 
                      x={pendingAdd.x * zoom} 
                      y={(pdfDimensions?.height ? pdfDimensions.height - pendingAdd.y : 842 - pendingAdd.y) * zoom}
                      onSelect={handleVariableSelect}
                      onClose={() => setPendingAdd(null)}
                   />
                  )}
              </div>
            ))}
          </Document>

          {/* Small bottom margin */}
          <div className="h-2" />
        </div>
      </div>
      
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
