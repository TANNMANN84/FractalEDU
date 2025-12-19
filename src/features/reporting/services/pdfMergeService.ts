
import { PDFDocument, PageSizes } from 'pdf-lib';

export const pdfMergeService = {
  async mergeReports(mainReportBlob: Blob, evidenceFiles: any[]) {
    const mainBuffer = await mainReportBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(mainBuffer);
    
    const unmergedFiles: any[] = [];

    for (const file of evidenceFiles) {
        if (!file.fileContent) continue;
        
        // Ensure content is ArrayBuffer
        let contentBuffer = file.fileContent;
        if (typeof contentBuffer === 'string') {
             // Convert Base64 string to Uint8Array/ArrayBuffer
             const base64 = contentBuffer.includes(',') ? contentBuffer.split(',')[1] : contentBuffer;
             try {
                 const binaryString = window.atob(base64);
                 const len = binaryString.length;
                 const bytes = new Uint8Array(len);
                 for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                 contentBuffer = bytes.buffer;
             } catch (e) {
                 console.error("Failed to decode base64 for file", file.fileName);
                 unmergedFiles.push({ name: file.fileName, data: contentBuffer });
                 continue;
             }
        }

        try {
            const lowerName = (file.fileName || '').toLowerCase();
            const type = (file.fileType || '').toLowerCase();

            if (type === 'application/pdf' || lowerName.endsWith('.pdf')) {
                const evidenceDoc = await PDFDocument.load(contentBuffer);
                const copiedPages = await pdfDoc.copyPages(evidenceDoc, evidenceDoc.getPageIndices());
                copiedPages.forEach((page) => pdfDoc.addPage(page));
            } else if (type.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png)$/)) {
                const page = pdfDoc.addPage(PageSizes.A4);
                let image;
                if (type.includes('png') || lowerName.endsWith('.png')) {
                    image = await pdfDoc.embedPng(contentBuffer);
                } else {
                    image = await pdfDoc.embedJpg(contentBuffer);
                }
                
                const { width, height } = page.getSize();
                // Layout with margins
                const margin = 50;
                const maxW = width - (margin * 2);
                const maxH = height - (margin * 2);
                
                const imgDims = image.scaleToFit(maxW, maxH);
                
                page.drawImage(image, {
                    x: (width - imgDims.width) / 2,
                    y: (height - imgDims.height) / 2,
                    width: imgDims.width,
                    height: imgDims.height,
                });
                
                // Caption
                page.drawText(`Evidence: ${file.fileName}`, { x: margin, y: height - 30, size: 10 });
            } else {
                unmergedFiles.push({ name: file.fileName, data: contentBuffer });
                
                // Add placeholder page for non-embeddable content
                const page = pdfDoc.addPage(PageSizes.A4);
                page.drawText(`Appendix: ${file.fileName}`, { x: 50, y: 700, size: 18 });
                page.drawText("This file format cannot be embedded directly.", { x: 50, y: 670, size: 12 });
                page.drawText("It has been included in the 'Attachments' folder of the download.", { x: 50, y: 650, size: 10 });
            }
        } catch (e) {
            console.error("Failed to merge file", file.fileName, e);
             unmergedFiles.push({ name: file.fileName, data: contentBuffer });
        }
    }

    const mergedPdfBytes = await pdfDoc.save();
    return {
        pdfBlob: new Blob([mergedPdfBytes as any], { type: 'application/pdf' }),
        unmergedFiles
    };
  }
};
