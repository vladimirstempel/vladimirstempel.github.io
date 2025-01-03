import './App.css'
import { useFetchPdf } from "./hooks/useFetchPdf.ts";
import { useOutlines } from "./hooks/useOutlines.ts";
import { BookmarkList } from "./components/BookmarkList.tsx";
import { PageCount } from "./components/PageCount.tsx";
import { Toolbar } from "./components/Toolbar.tsx";

function App() {
    const { pdf, pageCount, setPageCount, outlineList, setOutlineList } = useFetchPdf();

    useOutlines(pdf!, setOutlineList);

    return (<>
        <Toolbar pdf={pdf!} setOutlineList={setOutlineList} setPageCount={setPageCount} />

        <PageCount pageCount={pageCount}/>
        <BookmarkList outlineList={outlineList}/>
    </>)
}

export default App
