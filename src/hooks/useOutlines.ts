import { useEffect } from "react";
import { getOutlines, setOutline } from "../utils/pdf/outlines.ts";
import { PDFDocument } from "pdf-lib";
import { PDFOutline } from "../utils/pdf/outlines.type.ts";

export const useOutlines = (pdf: PDFDocument, setOutlineList: (outlines: PDFOutline[]) => void) => {

    useEffect(() => {
        if (pdf) {
            setTimeout(() => setOutlines(pdf, setOutlineList), 3000);
        }
    }, [pdf, setOutlineList]);
}

const setOutlines = async (pdf: PDFDocument, setOutlineList: (outlines: PDFOutline[]) => void) => {
    const pageIndices = pdf!.getPageIndices();
    const mainPages = pageIndices.filter(i => i <= 3);
    const childPages = pageIndices.filter(i => i > 3);

    const outlines = mainPages
        .map(idx => {
                if (idx === 3) {
                    return ({
                        title: `Test ${idx + 1}`,
                        to: idx,
                        open: true,
                        children: childPages.map((i, index) => ({
                            title: `Child ${index + 1}`,
                            to: i,
                            italic: true
                        }))
                    })
                }

                return ({
                    title: `Test ${idx + 1}`,
                    to: idx,
                    bold: true,
                    italic: true
                })
            }
        );

    setOutline(pdf!, outlines);

    setOutlineList(getOutlines(pdf!));
    await pdf!.save();
};