import { useEffect, useState } from 'react'
import './App.css'
import { PDFDocument } from 'pdf-lib'
import { setOutline } from './utils/pdf'

function App() {
    const [pdf, setPdf] = useState<PDFDocument | null>(null)
    const [pdf2, setPdf2] = useState<PDFDocument | null>(null)
    const [pdfRes, setPdfRes] = useState<ArrayBuffer | null>(null)

    useEffect(() => {
        fetch('/files/pdf-b.pdf')
            .then(res => res.blob())
            .then(blob => blob.arrayBuffer())
            .then(buffer => PDFDocument.load(buffer))
            .then(pdfDoc => {
                setPdf(pdfDoc);
                setPdf2(pdfDoc);
            })
    }, [])

    console.log('PDF:', pdf);

    useEffect(() => {
        if (pdf) {
            setOutlines();
        }
    }, [pdf]);

    const setOutlines = async () => {
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

        await setOutline(pdf!, outlines);

        const arrayBuffer: ArrayBuffer = await pdf!.save()
        setPdfRes(arrayBuffer);
    };

    const downloadPdf = (buffer: ArrayBuffer) => {
        const blob = new Blob([buffer]);
        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = 'res.pdf';
        a.click();
    }

    const mergePdf = async (target: PDFDocument, ...sourcePdfs: PDFDocument[]) => {
        for (const item of sourcePdfs) {
            const pages = await target.copyPages(item, item.getPageIndices());
            pages.forEach(page => target.addPage(page));
        };

        return await target.save();
    }

    useEffect(() => {
        if (pdfRes) {
            mergePdf(pdf!, pdf2!)
                .then(buffer => downloadPdf(buffer));
        }
    }, [pdfRes])

    return (
        <>
        </>
    )
}

export default App
