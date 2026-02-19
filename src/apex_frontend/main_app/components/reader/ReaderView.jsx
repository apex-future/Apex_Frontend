import React, { useEffect, useState, useRef, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContext';
import PDFReader from './PDFReader';
import ReaderNavBar from './ReaderNavBar';
import AIModal from './reading_navigations/reading_layout/AIModal';
import LeftPanel from './reading_navigations/reading_layout/LeftPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function ReaderView() {
    const { books, updateBookProgress } = useContext(BookContext);
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState(null);
    const [textContent, setTextContent] = useState("");

    // Find the book and determine type
    const book = useMemo(() => books.find(b => b.id.toString() === bookId), [books, bookId]);
    const isPdf = useMemo(() => book?.file?.type === 'application/pdf' || book?.file?.name.toLowerCase().endsWith('.pdf'), [book]);

    // --- Lifted PDF Controls State ---
    const [pageNumber, setPageNumber] = useState(book?.currentPage || 1);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);

    // Progress state
    const [localProgress, setLocalProgress] = useState(book?.progress || 0);
    const [localPages, setLocalPages] = useState({
        current: book?.currentPage || 1,
        total: book?.totalPages || 1
    });

    // Navigation Visibility State
    // States: 'none' | 'first' | 'second'
    const [navState, setNavState] = useState('none');
    const [locked, setLocked] = useState(false);
    const [aiModal, setAiModal] = useState(false);
    const [leftPanel, setLeftPanel] = useState(false);

    // --- PDF Control Handlers ---
    function nextPage() {
        setPageNumber(prev => {
            const next = Math.min(prev + 1, numPages || prev);
            syncProgress(next, numPages);
            return next;
        });
    }

    function previousPage() {
        setPageNumber(prev => {
            const next = Math.max(prev - 1, 1);
            syncProgress(next, numPages);
            return next;
        });
    }

    function zoomIn() {
        setScale(prev => Math.min(prev + 0.1, 2.5));
    }

    function zoomOut() {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }

    function rotate() {
        setRotation(prev => (prev + 90) % 360);
    }

    function resetZoom() {
        setScale(1.0);
    }

    function handleDocumentLoad({ numPages: total }) {
        setNumPages(total);
        syncProgress(pageNumber, total);
    }

    function syncProgress(page, total) {
        if (!book || !total) return;
        const progress = Math.round((page / total) * 100);
        setLocalProgress(progress);
        setLocalPages({ current: page, total });
        updateBookProgress(book.id, progress, page, total);
    }

    // Expose pdfControls object
    const pdfControls = isPdf
        ? { pageNumber, numPages, scale, rotation, nextPage, previousPage, zoomIn, zoomOut, rotate }
        : null;

    // Reader UI controls passed to FirstLayerNavBar
    const readerControls = {
        locked,
        onToggleLock: () => setLocked(prev => !prev),
        onResetZoom: resetZoom,
        progress: localProgress,
        pages: localPages,
    };

    // Screen click handler — standard toggle cycle
    const handleScreenClick = () => {
        setNavState(prev => {
            if (prev === 'none') return 'first';
            if (prev === 'first') return 'none';
            if (prev === 'second') return 'none';
            return 'none';
        });
    };

    // Refs for stability
    const updateProgressRef = useRef(updateBookProgress);
    const currentBookRef = useRef(book);
    useEffect(() => { updateProgressRef.current = updateBookProgress; }, [updateBookProgress]);
    useEffect(() => { currentBookRef.current = book; }, [book]);

    // 1. Loading & Redirect logic
    useEffect(() => {
        if (!book && bookId) {
            navigate('/');
            return;
        }

        if (book?.file) {
            const { file } = book;
            const isTypePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isTypeImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
            const isTypeText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

            if (isTypePdf || isTypeImage) {
                const url = URL.createObjectURL(file);
                setFileUrl(url);
                setTextContent("");
                return () => URL.revokeObjectURL(url);
            } else if (isTypeText) {
                const reader = new FileReader();
                reader.onload = (e) => { setTextContent(e.target.result); setFileUrl(null); };
                reader.readAsText(file);
            }
        }
    }, [bookId, book?.file]);

    // 2. Initial Reset effect
    useEffect(() => {
        if (!bookId) return;
        window.scrollTo(0, 0);
        if (book) {
            setLocalProgress(book.progress || 0);
            setLocalPages({ current: book.currentPage || 1, total: book.totalPages || 1 });
            setPageNumber(book.currentPage || 1);
        }
    }, [bookId]);

    // 3. Scroll logic for text content
    const lastUpdateRef = useRef(0);
    useEffect(() => {
        if (isPdf) return;

        const handleScroll = () => {
            const b = currentBookRef.current;
            if (!b) return;

            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const scrollableHeight = docHeight - window.innerHeight;

            const progress = scrollableHeight > 0
                ? Math.min(100, Math.max(0, Math.round((scrollY / scrollableHeight) * 100)))
                : 100;

            const totalPages = Math.max(1, Math.ceil(docHeight / 1000));
            const currentPage = Math.min(totalPages, Math.floor(scrollY / 1000) + 1);

            setLocalProgress(progress);
            setLocalPages({ current: currentPage, total: totalPages });

            const now = Date.now();
            if (now - lastUpdateRef.current > 300) {
                const hasChanged = progress !== b.progress || currentPage !== b.currentPage || totalPages !== b.totalPages;
                if (hasChanged || progress === 100) {
                    updateProgressRef.current(b.id, progress, currentPage, totalPages);
                    lastUpdateRef.current = now;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        const timer = setTimeout(handleScroll, 500);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [bookId, textContent, fileUrl, isPdf]);

    if (!book) return null;

    return (
        <div
            className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-serif selection:bg-accent-primary/20 relative overflow-hidden"
            onClick={handleScreenClick}
        >
            <div className="flex h-screen overflow-hidden relative">
                {/* Far-left panel — shown when Menu is clicked */}
                {leftPanel && <LeftPanel setLeftPanel={setLeftPanel} />}

                {/* Main reading area */}
                <div className="flex-1 relative min-w-0 flex flex-col overflow-hidden">

                    {/* ── Nav overlay (click/tap to reveal) ── */}
                    <ReaderNavBar
                        book={book}
                        navigate={navigate}
                        navState={navState}
                        setNavState={setNavState}
                        aiModal={aiModal}
                        setAiModal={setAiModal}
                        leftPanel={leftPanel}
                        setLeftPanel={setLeftPanel}
                        pdfControls={pdfControls}
                        readerControls={readerControls}
                    />

                    {/* ── PDF Content ── */}
                    {fileUrl && isPdf && (
                        <div className="flex-1 flex overflow-hidden relative">
                            <PDFReader
                                fileUrl={fileUrl}
                                pageNumber={pageNumber}
                                scale={scale}
                                rotation={rotation}
                                onDocumentLoad={handleDocumentLoad}
                                onNextPage={nextPage}
                                onPrevPage={previousPage}
                                locked={locked}
                            />

                            {/* ── Desktop persistent prev/next buttons (md and up) ──
                                Always visible, not gated by navState.
                                Fixed to the left/right edges, vertically centred. */}
                            <button
                                onClick={(e) => { e.stopPropagation(); previousPage(); }}
                                disabled={pageNumber <= 1}
                                className="
                                    hidden md:flex
                                    absolute left-3 top-1/2 -translate-y-1/2
                                    z-40 items-center justify-center
                                    w-10 h-10 rounded-full
                                    bg-black/10 hover:bg-black/20
                                    backdrop-blur-sm border border-white/20
                                    text-gray-700 hover:text-gray-900
                                    transition-all duration-200 active:scale-95
                                    disabled:opacity-20 disabled:cursor-not-allowed
                                    shadow-md
                                "
                                title="Previous page"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={22} strokeWidth={2} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); nextPage(); }}
                                disabled={pageNumber >= (numPages || 1)}
                                className="
                                    hidden md:flex
                                    absolute right-3 top-1/2 -translate-y-1/2
                                    z-40 items-center justify-center
                                    w-10 h-10 rounded-full
                                    bg-black/10 hover:bg-black/20
                                    backdrop-blur-sm border border-white/20
                                    text-gray-700 hover:text-gray-900
                                    transition-all duration-200 active:scale-95
                                    disabled:opacity-20 disabled:cursor-not-allowed
                                    shadow-md
                                "
                                title="Next page"
                                aria-label="Next page"
                            >
                                <ChevronRight size={22} strokeWidth={2} />
                            </button>
                        </div>
                    )}

                    {/* ── Image content ── */}
                    {fileUrl && !isPdf && (
                        <div className="flex-1 flex justify-center overflow-auto p-4">
                            <img src={fileUrl} alt="content" className="max-w-full rounded-3xl shadow-2xl border-4 border-white/50" />
                        </div>
                    )}

                    {/* ── Text content ── */}
                    {!fileUrl && (
                        <div className="flex-1 overflow-auto">
                            <div className="max-w-3xl mx-auto px-8 sm:px-12 py-8 leading-[1.8] text-xl sm:text-2xl text-gray-800 antialiased">
                                {textContent ? (
                                    <div className="whitespace-pre-wrap animate-in fade-in duration-1000">{textContent}</div>
                                ) : (
                                    <div className="text-center py-40 flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full border-t-2 border-accent-primary animate-spin mb-4" />
                                        <p className="opacity-50 text-sm font-sans tracking-wide">Initializing view...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI panel — shown when Sparkles is clicked */}
                {aiModal && <AIModal setAiModal={setAiModal} />}
            </div>
        </div>
    );
}

export default ReaderView;
