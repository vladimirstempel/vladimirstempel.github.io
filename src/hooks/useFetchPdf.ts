import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { getOutlines } from "../utils/pdf/outlines.ts";
import { PDFOutline } from "../utils/pdf/outlines.type.ts";

export const useFetchPdf = () => {
    const [pdf, setPdf] = useState<PDFDocument | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [outlineList, setOutlineList] = useState<PDFOutline[]>([]);

    useEffect(() => {
        fetch('/files/pdf-b.pdf')
            .then(res => res.blob())
            .then(blob => blob.arrayBuffer())
            .then(buffer => PDFDocument.load(buffer))
            .then(pdfDoc => {
                setPdf(pdfDoc);
                setPageCount(pdfDoc.getPageIndices().length);
                setOutlineList(getOutlines(pdfDoc));
            })
    }, []);

    return { pdf, pageCount, setPageCount, outlineList, setOutlineList };
}