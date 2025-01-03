import { FC } from "react";

interface PageCountProps {
    pageCount: number;
}

export const PageCount: FC<PageCountProps> = ({ pageCount }) => {
    return (
        <p>Page count: {pageCount}</p>
    );
}