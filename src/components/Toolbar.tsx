import { ChangeEvent, FC, useRef, useState } from "react";
import { getOutlines, mergeOutlines } from "../utils/pdf/outlines.ts";
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

    const triggerUploadPdf = async () => uploadRef.current!.click();

    const handleDownloadPdf = async () => {
        const buffer = await pdf!.save();
        const blob = new Blob([buffer]);
        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = 'result.pdf';
        a.click();
    };

    const handleMergePdf = async () => {
        if (uploadedPdf) {
            await mergePdf(pdf!, uploadedPdf);

            setMerged(true);
            setOutlineList(getOutlines(pdf!));
        }
    };

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);

            setUploadedPdf(pdfDoc);
        }

        e.target.value = '';
    }

    const mergePdf = async (target: PDFDocument, ...sourcePdfs: PDFDocument[]): Promise<void> => {
        for (const item of sourcePdfs) {
            const targetLastPageNumber = target.getPageIndices().length;

            const pages = await target.copyPages(item, item.getPageIndices());
            pages.forEach(page => target.addPage(page));

            mergeOutlines(target, getOutlines(item), targetLastPageNumber);

            setOutlineList(getOutlines(target));
        }

        setPageCount(target.getPageIndices().length);
    };

    return (<>
        <div className="pdf-names">
            <p>PDFs loaded:</p>
            <p>1. {pdf?.getTitle()}</p>
            { uploadedPdf && <p>2. {uploadedPdf?.getTitle()}</p>}
        </div>
        <div className="button-group">
            <button
                onClick={() => !uploadedPdf && triggerUploadPdf()}>{!uploadedPdf ? 'Upload PDF' : 'Uploaded'}</button>
            <button onClick={() => !merged && handleMergePdf()}>{!merged ? 'Merge PDFs' : 'Merged'}</button>
            {merged && <button onClick={() => handleDownloadPdf()}>Download Final PDF</button>}
            <input className='hidden' type="file" accept='application/pdf' onChange={handleUpload} ref={uploadRef}/>
        </div>
    </>);
}