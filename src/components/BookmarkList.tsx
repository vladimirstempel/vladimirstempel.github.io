import { PDFOutline } from "../utils/pdf/outlines.type.ts";
import { FC, useEffect, useState } from "react";
import { BookmarkListItem } from "./BookmarkListItem.tsx";

interface BookmarkListProps {
    outlineList: PDFOutline[]
}

export const BookmarkList: FC<BookmarkListProps> = ({outlineList}) => {
    const [showMessage, setShowMessage] = useState(true);

    useEffect(() => {
        setTimeout(() => setShowMessage(false), 3000);
    }, []);

    return (
        <>
            { showMessage && <p>Bookmarks are going to change after 3 seconds:</p> }
            <ul className='outline-list'>
                {
                    outlineList.map((outline: PDFOutline, index: number) =>
                        <BookmarkListItem outline={outline} key={index}/>)
                }
            </ul>
        </>
    )
}