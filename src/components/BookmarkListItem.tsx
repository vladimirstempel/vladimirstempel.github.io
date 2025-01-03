import { PDFOutline } from "../utils/pdf/outlines.type.ts";
import { FC } from "react";

interface BookmarkListItemProps {
    outline: PDFOutline
}

export const BookmarkListItem: FC<BookmarkListItemProps> = ({ outline }) => {
    return (
        <li>
            {outline.title}
            {'children' in outline && <ul>
                {outline.children.map((child: PDFOutline) => (
                    <li key={child.to as number}>{child.title}</li>
                ))}
            </ul>}
        </li>
    );
};