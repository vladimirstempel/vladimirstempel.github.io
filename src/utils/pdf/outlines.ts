import { PDFArray, PDFDocument, PDFName, PDFObject, PDFRef, PDFString } from 'pdf-lib'
import { PDFOutline, PDFOutlineItemWithChildren, PDFOutlineTo } from "./outlines.type.ts";

/**
 * Sets the outline (bookmarks) for a PDF document. The method updates the document's catalog
 * with a new outline structure based on the provided outline array.
 *
 * @param {PDFDocument} doc - The PDFDocument instance to modify.
 * @param {readonly PDFOutline[]} outlines - The array of outline objects representing the new structure.
 * Each outline may include titles, destinations, styles (bold/italic), and nested children.
 */
export const setOutline = (
    doc: PDFDocument,
    outlines: readonly PDFOutline[]
) => {
    const rootRef = doc.context.nextRef()
    const refMap = new WeakMap<PDFOutline, PDFRef>()

    // Pre-allocate references for all outlines
    for (const outline of flatten(outlines)) {
        refMap.set(outline, doc.context.nextRef())
    }

    // Collect references to all pages
    const pageRefs = (() => {
        const refs: PDFRef[] = []

        doc.catalog.Pages().traverse((kid, ref) => {
            if (kid.get(kid.context.obj('Type'))?.toString() === '/Page') {
                refs.push(ref)
            }
        })

        return refs
    })()

    /**
     * Recursively creates the outline structure in the document.
     *
     * @param {readonly PDFOutline[]} outlines - The array of outlines to process.
     * @param {PDFRef} parent - The parent reference for the current level of outlines.
     */
    const createOutline = (outlines: readonly PDFOutline[], parent: PDFRef) => {
        const {length} = outlines

        for (let i = 0; i < length; i += 1) {
            const outline = outlines[i]
            const outlineRef = refMap.get(outline)!

            // Determine the destination or action for the outline
            const destOrAction = (() => {
                if (typeof outline.to === 'number') {
                    return {Dest: [pageRefs[outline.to], 'Fit']}
                } else if (Array.isArray(outline.to)) {
                    const page = doc.getPage(outline.to[0])
                    const width = page.getWidth()
                    const height = page.getHeight()

                    return {
                        Dest: [
                            pageRefs[outline.to[0]],
                            'XYZ',
                            width * outline.to[1],
                            height * outline.to[2],
                            null,
                        ],
                    }
                }
                return {}
            })()

            // Handle child outlines
            const childrenDict = (() => {
                if ('children' in outline && outline.children?.length > 0) {
                    createOutline(outline.children, outlineRef)

                    return {
                        First: refMap.get(outline.children[0])!,
                        Last: refMap.get(outline.children[outline.children.length - 1])!,
                        Count: getOpeningCount(outline.children) * (outline.open ? 1 : -1),
                    }
                }
                return {}
            })()

            // Assign the outline dictionary
            doc.context.assign(
                outlineRef,
                doc.context.obj({
                    Title: PDFString.of(outline.title),
                    Parent: parent,
                    ...(i > 0 ? {Prev: refMap.get(outlines[i - 1])!} : {}),
                    ...(i < length - 1 ? {Next: refMap.get(outlines[i + 1])!} : {}),
                    ...childrenDict,
                    ...destOrAction,
                    F: (outline.italic ? 1 : 0) | (outline.bold ? 2 : 0),
                })
            )
        }
    }

    // Create the outlines in the document
    createOutline(outlines, rootRef)

    // Set the root outline dictionary
    const rootCount = getOpeningCount(outlines)
    doc.context.assign(
        rootRef,
        doc.context.obj({
            Type: 'Outlines',
            ...(rootCount > 0
                ? {
                    First: refMap.get(outlines[0])!,
                    Last: refMap.get(outlines[outlines.length - 1])!,
                }
                : {}),
            Count: rootCount,
        })
    )

    // Attach the outline structure to the document's catalog
    doc.catalog.set(doc.context.obj('Outlines'), rootRef)
}

/**
 * Walks through the outline tree and applies a callback function to each outline.
 *
 * @param {readonly PDFOutline[]} outlines - The array of outlines to traverse.
 * @param {(outline: PDFOutline) => void | boolean} callback - A function to apply to each outline.
 * Returning `false` stops traversal of children for the current node.
 */
const walk = (
    outlines: readonly PDFOutline[],
    callback: (outline: PDFOutline) => void | boolean // stop walking to children if returned false
) => {
    for (const outline of outlines) {
        const ret = callback(outline)
        if ('children' in outline && ret !== false) walk(outline.children, callback)
    }
}

/**
 * Flattens a hierarchical outline structure into a single-level array.
 *
 * @param {readonly PDFOutline[]} outlines - The array of hierarchical outlines.
 * @returns {PDFOutline[]} A flattened array of all outlines.
 */
const flatten = (outlines: readonly PDFOutline[]) => {
    const result: PDFOutline[] = []

    walk(outlines, (outline) => void result.push(outline))
    return result
}

/**
 * Calculates the count of outlines that should be considered "open".
 *
 * @param {readonly PDFOutline[]} outlines - The array of outlines to evaluate.
 * @returns {number} The count of open outlines.
 */
const getOpeningCount = (outlines: readonly PDFOutline[]) => {
    let count = 0

    walk(outlines, (outline) => {
        count += 1
        return !('open' in outline && !outline.open)
    })

    return count
}

/**
 * Extracts and parses the bookmarks (outlines) from a PDF document.
 *
 * @param {PDFDocument} pdfDoc - The PDFDocument instance to extract bookmarks from.
 * @returns {PDFOutline[]} An array of bookmark objects representing the PDF's outline structure.
 * Each object includes information such as title, destination, styling (bold/italic), and nested children.
 */
export const getOutlines = (pdfDoc: PDFDocument): PDFOutline[] => {
    const catalog: PDFObject = pdfDoc.context.lookup(pdfDoc.catalog)!;
    const outlinesRef = catalog.get(PDFName.of('Outlines'));
    if (!outlinesRef) return [];

    const outlines: PDFObject = pdfDoc.context.lookup(outlinesRef)!;
    const firstOutlineRef = outlines.get(PDFName.of('First'));

    return parseOutline(pdfDoc, firstOutlineRef);
};

/**
 * Recursively parses a PDF's bookmark tree to extract data such as title, destination,
 * styles (bold/italic), and nested children.
 *
 * @param {PDFDocument} pdfDoc - The PDFDocument instance for resolving references.
 * @param {unknown} current - A reference to the current bookmark node in the linked list.
 * @returns {PDFOutline[]} An array of parsed bookmark objects, including nested children.
 */
const parseOutline = (pdfDoc: PDFDocument, current: PDFObject): PDFOutline[] => {
    const bookmarks: PDFOutline[] = [];

    while (current) {
        const bookmark: PDFObject = pdfDoc.context.lookup(current)!;
        const dest = bookmark.get(PDFName.of('Dest'));
        let pageIndex = null;

        // Resolve page index from the destination
        if (dest && dest instanceof PDFArray) {
            const pageRef = dest.get(0);
            if (pageRef) {
                pageIndex = pdfDoc.getPageIndices().find(index => {
                    return pdfDoc.getPage(index).ref === pageRef;
                });
            }
        }


        // Extract styles (italic/bold) from the bookmark
        const flags = bookmark.get(PDFName.of('F'));
        const italic = (flags & 1) !== 0;
        const bold = (flags & 2) !== 0;

        const title = bookmark.get(PDFName.of('Title')).decodeText();
        const childrenRef = bookmark.get(PDFName.of('First'));
        const children = childrenRef ? parseOutline(pdfDoc, childrenRef) : [];

        const bookmarkData: PDFOutline = {
            title,
            to: pageIndex as PDFOutlineTo,
            bold,
            italic
        };

        if (children?.length) {
            (<PDFOutlineItemWithChildren>bookmarkData).children = children;
            (<PDFOutlineItemWithChildren>bookmarkData).open = false; // Default to closed
        }

        bookmarks.push(bookmarkData);

        current = bookmark.get(PDFName.of('Next')); // Move to the next sibling
    }

    return bookmarks;
};