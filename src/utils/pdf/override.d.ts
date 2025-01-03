import 'pdf-lib';

declare module 'pdf-lib' {
    type PDFObject = PDFObject & Map<string, unknown>;
}