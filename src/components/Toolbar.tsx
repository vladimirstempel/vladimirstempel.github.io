import { ChangeEvent, FC, useRef, useState } from "react";
import { getOutlines, setOutline } from "../utils/pdf/outlines.ts";
import { PDFDocument } from "pdf-lib";
import { PDFOutline } from "../utils/pdf/outlines.type.ts";

interface ToolbarProps {
    pdf: PDFDocument;
    setOutlineList: (outlines: PDFOutline[]) => void;
    setPageCount: (count: number) => void;
}

export const Toolbar: FC<ToolbarProps> = ({ pdf, setOutlineList, setPageCount }) => {
    const [uploadedPdf, setUploadedPdf] = useState<PDFDocument | null>(null)
    const [merged, setMerged] = useState<boolean>(false);
    const uploadRef = useRef<HTMLInputElement>(null);

    const handleUploadPdf = async () => uploadRef.current!.click();

    const handleMergePdf = async () => {
        if (uploadedPdf) {
            await mergePdf(pdf!, uploadedPdf);

            setMerged(true);
            setOutlineList(getOutlines(pdf!));
        }
    };

    const handleDownloadPdf = async () => {
        const buffer = await pdf!.save();
        const blob = new Blob([buffer]);
        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = 'res.pdf';
        a.click();
    };

    const mergePdf = async (target: PDFDocument, ...sourcePdfs: PDFDocument[]): Promise<void> => {
        for (const item of sourcePdfs) {
            const targetLastPageNumber = target.getPageIndices().length;
            const pages = await target.copyPages(item, item.getPageIndices());
            pages.forEach(page => target.addPage(page));

            processOutlines(target, getOutlines(item), targetLastPageNumber);
        }

        setPageCount(target.getPageIndices().length);
    };

    const processOutlines = (target: PDFDocument, outlines: PDFOutline[], offset: number): void => {
        const targetOutlines = getOutlines(target);

        const handleOffset = (outline: PDFOutline): PDFOutline => {
            if ('children' in outline) {
                return ({
                    ...outline,
                    children: outline.children.map(handleOffset)
                });
            }
            return ({
                ...outline,
                to: (Number(outline.to) + offset)
            })
        };

        outlines = outlines.map(handleOffset);

        setOutline(target, targetOutlines.concat(outlines));

        setOutlineList(getOutlines(target));
    }

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);

            setUploadedPdf(pdfDoc);
        }

        e.target.value = '';
    }

    return (
        <div className="button-group">
            <button
                onClick={() => !uploadedPdf && handleUploadPdf()}>{!uploadedPdf ? 'Upload PDF' : 'Uploaded'}</button>
            <button onClick={() => !merged && handleMergePdf()}>{!merged ? 'Merge PDFs' : 'Merged'}</button>
            {merged && <button onClick={() => handleDownloadPdf()}>Download Final PDF</button>}
            <input className='hidden' type="file" accept='application/pdf' onChange={handleUpload} ref={uploadRef}/>
        </div>
    );
}