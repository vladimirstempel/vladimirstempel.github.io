import { PDFOutline } from "../utils/pdf/outlines.type.ts";
import { FC } from "react";
import { BookmarkListItem } from "./BookmarkListItem.tsx";

interface BookmarkListProps {
    outlineList: PDFOutline[]
}

export const BookmarkList: FC<BookmarkListProps> = ({ outlineList }) => {
    return (
        <>
            <p>Bookmarks are going to change after 3 seconds:</p>
            <ul className='outline-list'>
                {
                    outlineList.map((outline: PDFOutline, index: number) =>
                        <BookmarkListItem outline={outline} key={index} />)
                }
            </ul>
        </>
    )
}