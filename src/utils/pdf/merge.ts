import { PDFDocument } from 'pdf-lib';
import { getOutlines, mergeOutlines } from './outlines.ts';

/**
 * Merges multiple PDFs into a target PDF.
 *
 * This function copies all pages from the source PDF documents and appends them
 * to the target PDF document. It also merges the outlines (bookmarks) of the source PDFs
 * into the target PDF, updating the outline indices as new pages are added.
 *
 * @param {PDFDocument} target - The target PDF document to which pages and outlines will be added.
 * @param {...PDFDocument[]} sourcePdfs - One or more source PDF documents whose pages and outlines will be merged into the target.
 * @returns {Promise<void>} A promise that resolves when the merge process is complete.
 *
 * @example
 * const targetPdf = await PDFDocument.create();
 * const sourcePdf1 = await PDFDocument.load(sourcePdfData1);
 * const sourcePdf2 = await PDFDocument.load(sourcePdfData2);
 * await mergePdf(targetPdf, sourcePdf1, sourcePdf2);
 */
export const mergePdf = async (target: PDFDocument, ...sourcePdfs: PDFDocument[]): Promise<void> => {
    for (const item of sourcePdfs) {
        const targetLastPageNumber = target.getPageIndices().length;

        const pages = await target.copyPages(item, item.getPageIndices());
        pages.forEach(page => target.addPage(page));

        mergeOutlines(target, getOutlines(item), targetLastPageNumber);
    }
};