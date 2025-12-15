import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { EditorTextField, EditorImageField } from '../types';
import type { VirtualPage } from '../stores/editorStore';
import { replacePlaceholders } from './dummyData';

const IMAGE_TYPE_LABELS: Record<string, string> = {
  gallery: "Offer Gallery",
  floorPlan: "Floor Plans",
  unitLocation: "Unit Location",
};

export async function generateSamplePdf(
  pdfBytes: ArrayBuffer,
  textFields: EditorTextField[],
  virtualPages: VirtualPage[],
  imageFields: EditorImageField[]
): Promise<Uint8Array> {
  // Load the source PDF
  const sourcePdfDoc = await PDFDocument.load(pdfBytes);
  
  // Create a new PDF
  const newPdfDoc = await PDFDocument.create();
  
  // Embed a standard font
  const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Get source pages
  const sourcePages = sourcePdfDoc.getPages();
  const sourceDims = sourcePages.length > 0 ? sourcePages[0].getSize() : { width: 595.28, height: 841.89 };

  for (const vPage of virtualPages) {
    if (vPage.type === 'pdf') {
      // Copy page from source
      // pageNum is 1-indexed, pdf-lib is 0-indexed
      const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDoc, [vPage.pageNum - 1]);
      const page = newPdfDoc.addPage(copiedPage);
      const { width } = page.getSize();
      
      // Find text fields for this specific ORIGINAL page number
      // Text fields are stored with 0-indexed page number matching the original PDF
      const pageFields = textFields.filter(f => f.page === vPage.pageNum - 1);

      for (const field of pageFields) {
        // Convert color hex to RGB
        const r = parseInt(field.color.slice(1, 3), 16) / 255;
        const g = parseInt(field.color.slice(3, 5), 16) / 255;
        const b = parseInt(field.color.slice(5, 7), 16) / 255;

        // Replace placeholders with dummy data
        const text = replacePlaceholders(field.content);
        
        // Calculate X position
        let x = field.x;
        if (field.isHorizontallyCentered) {
            const textWidth = helveticaFont.widthOfTextAtSize(text, field.size);
            x = (width / 2) - (textWidth / 2);
        }
        
        // Draw text
        // field.y is stored as PDF coordinates (from bottom)
        // pdf-lib uses Y from bottom-left (baseline)
        const adjustedY = field.y - field.size - (field.size * 0.2); 
        
        // Adjust X for padding (px-1 = 4px)
        let finalX = x;
        if (!field.isHorizontallyCentered) {
            finalX += 4;
        }

        page.drawText(text, {
          x: finalX,
          y: adjustedY, 
          size: field.size,
          font: helveticaFont,
          color: rgb(r, g, b),
        });
      }
    } else if (vPage.type === 'image') {
       // Create blank page for image placeholder
       const page = newPdfDoc.addPage([sourceDims.width, sourceDims.height]);
       const { width, height } = page.getSize();
       
       const imgField = imageFields.find(img => img.id === vPage.imageId);
       if (imgField) {
         const label = IMAGE_TYPE_LABELS[imgField.type] || "Image Placeholder";
         const textWidth = helveticaBold.widthOfTextAtSize(label, 24);
         
         // Draw a simple placeholder visual
         page.drawText(label, {
            x: (width / 2) - (textWidth / 2),
            y: (height / 2),
            size: 24,
            font: helveticaBold,
            color: rgb(0.3, 0.3, 0.3),
         });
         
         const subText = `Variable: ${imgField.var}`;
         const subTextWidth = helveticaFont.widthOfTextAtSize(subText, 14);
         page.drawText(subText, {
            x: (width / 2) - (subTextWidth / 2),
            y: (height / 2) - 30,
            size: 14,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
         });
       }
    }
  }

  // Save the PDF
  const pdfBytesSaved = await newPdfDoc.save();
  return pdfBytesSaved;
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
