# PDF Outlines Manipulation

This project provides utilities for manipulating PDF outlines (bookmarks) using the `pdf-lib` library. These tools allow you to extract, merge, and modify outlines in PDF documents while handling nested structures and formatting like bold and italic text.

## Features

- **Extract Outlines**: Retrieve and parse the outline structure from a PDF document.
- **Set Outlines**: Define and set custom outlines for a PDF document.
- **Merge Outlines**: Combine outlines from multiple PDFs into one, with proper page offset handling.
- **Formatting Support**: Supports bold and italic formatting for outline titles.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/vladimirstempel/pdf-playground.git
cd pdf-playground
npm install
```

## Usage

### Extract Outlines

Use the `getOutlines` function to extract and parse outlines from a PDF document:

```typescript
import { PDFDocument } from 'pdf-lib';
import { getOutlines } from './utils/pdf-utils';

const pdfDoc = await PDFDocument.load(pdfBytes);
const outlines = getOutlines(pdfDoc);
console.log(outlines);
```

### Set Outlines

Use the `setOutline` function to set custom outlines for a PDF document:

```typescript
import { PDFDocument } from 'pdf-lib';
import { setOutline, PDFOutline } from './utils/pdf-utils';

const pdfDoc = await PDFDocument.load(pdfBytes);

const outlines: PDFOutline[] = [
  {
    title: 'Chapter 1',
    to: 0, // Page index
    bold: true,
    children: [
      { title: 'Section 1.1', to: 1 },
      { title: 'Section 1.2', to: 2, italic: true },
    ],
  },
  { title: 'Chapter 2', to: 3 },
];

await setOutline(pdfDoc, outlines);
const updatedPdfBytes = await pdfDoc.save();
```

### Merge Outlines

Combine outlines from two PDFs while adjusting page references:

```typescript
import { PDFDocument } from 'pdf-lib';
import { mergeOutlines } from './utils/pdf-utils';

const targetPdf = await PDFDocument.load(targetPdfBytes);
const sourcePdf = await PDFDocument.load(sourcePdfBytes);

const sourceOutlines = getOutlines(sourcePdf);
mergeOutlines(targetPdf, sourceOutlines, targetPdf.getPageCount());

const mergedPdfBytes = await targetPdf.save();
```

## API Reference

### `getOutlines`

Extracts and parses the outlines from a given PDF document.

**Parameters:**
- `pdfDoc: PDFDocument` - The PDF document from which to extract outlines.

**Returns:**
- `PDFOutline[]` - An array of parsed outlines.

### `setOutline`

Sets custom outlines for a PDF document.

**Parameters:**
- `doc: PDFDocument` - The target PDF document.
- `outlines: PDFOutline[]` - The array of outlines to set.

### `mergeOutlines`

Merges outlines from a source PDF into a target PDF.

**Parameters:**
- `target: PDFDocument` - The target PDF document.
- `outlines: PDFOutline[]` - The outlines from the source PDF.
- `offset: number` - The page offset to apply to the outlines being merged.

## Types

### `PDFOutline`

Represents an outline item.

```typescript
type PDFOutlineTo = number | [pageIndex: number, xPercentage: number, yPercentage: number];

interface PDFOutlineItem {
  title: string;
  to: PDFOutlineTo;
  italic?: boolean;
  bold?: boolean;
}

interface PDFOutlineItemWithChildren extends Omit<PDFOutlineItem, 'to'> {
  to?: PDFOutlineTo;
  children: PDFOutline[];
  open: boolean;
}

type PDFOutline = PDFOutlineItem | PDFOutlineItemWithChildren;
```

## Repository

The full source code for these utilities can be found in the [GitHub repository](https://github.com/vladimirstempel/pdf-playground/tree/main).

## License

This project is licensed under the MIT License.
