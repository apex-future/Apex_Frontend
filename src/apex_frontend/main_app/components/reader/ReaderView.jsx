import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import PDFReader from './PDFReader';
import ReaderNavBar from './ReaderNavBar';
import AIModal from './reading_navigations/reading_layout/AIModal';
import HighlightMenu from './HighlightMenu';
import LeftPanel from './reading_navigations/reading_layout/LeftPanel';
import { ChevronLeft, ChevronRight, Plus, Menu } from 'lucide-react';

function ReaderView() {
    const { books, updateBookProgress, toggleBookmark } = useContext(BookContext);
    const { bookId } = useParams();
    const navigate = useNavigate();

    const [fileUrl, setFileUrl] = useState(null);
    const [textContent, setTextContent] = useState("");

    // Responsive window size hook
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    const [navState, setNavState] = useState('none');
    const [locked, setLocked] = useState(false);
    const [aiModal, setAiModal] = useState(false);
    const [leftPanel, setLeftPanel] = useState(false);

    // Selection State
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);

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

    function goToPage(n) {
        const page = Math.min(Math.max(1, n), numPages || n);
        setPageNumber(page);
        syncProgress(page, numPages);
    }

    // Bookmarks
    const bookmarks = book?.metadata?.bookmarks || [];
    const isCurrentPageBookmarked = bookmarks.some(bm => bm.page === pageNumber);

    // Expose pdfControls object
    const pdfControls = isPdf
        ? { pageNumber, numPages, scale, rotation, nextPage, previousPage, zoomIn, zoomOut, rotate, goToPage }
        : null;

    // Reader UI controls passed to FirstLayerNavBar
    const readerControls = {
        locked,
        onToggleLock: () => setLocked(prev => !prev),
        onResetZoom: resetZoom,
        progress: localProgress,
        pages: localPages,
        // Bookmarks
        isBookmarked: isCurrentPageBookmarked,
        onToggleBookmark: () => toggleBookmark(book.id, pageNumber),
        bookmarks,
        onJumpToBookmark: goToPage,
        onRemoveBookmark: (page) => toggleBookmark(book.id, page),
    };

    // Screen handlers
    const toggleNav = useCallback(() => {
        setNavState(prev => prev === 'none' ? 'first' : 'none');
    }, []);

    // Selection monitoring logic
    useEffect(() => {
        const handleSelectionChange = () => {
            const activeSel = window.getSelection();
            const text = activeSel.toString().trim();

            if (text && text.length > 0) {
                const range = activeSel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelection({
                    text,
                    x: rect.left + rect.width / 2,
                    y: rect.top
                });
                setShowHighlightMenu(true);
            } else {
                setShowHighlightMenu(false);
            }
        };

        document.addEventListener('mouseup', handleSelectionChange);
        return () => document.removeEventListener('mouseup', handleSelectionChange);
    }, []);

    // Refs for stability
    const updateProgressRef = useRef(updateBookProgress);
    const currentBookRef = useRef(book);
    useEffect(() => { updateProgressRef.current = updateBookProgress; }, [updateBookProgress]);
    useEffect(() => { currentBookRef.current = book; }, [book]);

    useEffect(() => {
        if (!book && bookId) {
            navigate('/');
            return;
        }

        const file = book?.file;
        if (file) {
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
                reader.onload = (e) => {
                    setTextContent(e.target.result);
                    setFileUrl(null);
                };
                reader.readAsText(file);
            }
        }
    }, [bookId, book?.file, navigate]);

    useEffect(() => {
        if (!bookId || !book) return;
        window.scrollTo(0, 0);
        setLocalProgress(book.progress || 0);
        setLocalPages({ current: book.currentPage || 1, total: book.totalPages || 1 });
        setPageNumber(book.currentPage || 1);
    }, [bookId]);

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
            className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-serif selection:bg-blue-200/50 relative overflow-hidden"
            onDoubleClick={toggleNav}
        >
            {/* Subtle Menu Trigger - Persistent at top */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleNav(); }}
                    className="group bg-white/40 hover:bg-white/90 backdrop-blur-md border border-slate-200/30 px-4 py-1.5 rounded-b-2xl transition-all hover:translate-y-0 -translate-y-[80%] flex items-center gap-2 shadow-sm"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Menu</span>
                    <Menu size={12} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>
            </div>

            <div className="flex h-screen overflow-hidden relative">
                {/* Far-left panel */}
                {leftPanel && <LeftPanel setLeftPanel={setLeftPanel} readerControls={readerControls} pdfControls={pdfControls} />}

                {/* Highlight Menu */}
                {showHighlightMenu && (
                    <HighlightMenu 
                        selection={selection.text}
                        position={{ x: selection.x, y: selection.y }}
                        onAskAI={() => {
                            setAiModal(true);
                            setShowHighlightMenu(false);
                        }}
                        onClose={() => setShowHighlightMenu(false)}
                    />
                )}

                {/* Main reading area */}
                <div className="flex-1 relative min-w-0 flex flex-col overflow-hidden">

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

                    {/* PDF Content */}
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
                                windowSize={windowSize}
                            />

                            <button
                                onClick={(e) => { e.stopPropagation(); previousPage(); }}
                                disabled={pageNumber <= 1}
                                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-sm border border-white/20 text-gray-700 hover:text-gray-900 transition-all duration-200 active:scale-95 disabled:opacity-20 shadow-sm"
                                title="Previous page"
                            >
                                <ChevronLeft size={22} strokeWidth={2} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); nextPage(); }}
                                disabled={pageNumber >= (numPages || 1)}
                                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-sm border border-white/20 text-gray-700 hover:text-gray-900 transition-all duration-200 active:scale-95 disabled:opacity-20 shadow-sm"
                                title="Next page"
                            >
                                <ChevronRight size={22} strokeWidth={2} />
                            </button>
                        </div>
                    )}

                    {/* Image content */}
                    {fileUrl && !isPdf && (
                        <div className="flex-1 flex justify-center overflow-auto p-4">
                            <img src={fileUrl} alt="content" className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl border-4 border-white/50" />
                        </div>
                    )}

                    {/* Text content */}
                    {!fileUrl && (
                        <div className="flex-1 overflow-auto">
                            <div className="max-w-3xl mx-auto px-8 sm:px-12 py-8 leading-[1.8] text-xl sm:text-2xl text-gray-800 antialiased">
                                {textContent ? (
                                    <div className="whitespace-pre-wrap animate-in fade-in duration-1000">{textContent}</div>
                                ) : book?.file ? (
                                    <div className="text-center py-40 flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full border-t-2 border-accent-primary animate-spin mb-4" />
                                        <p className="opacity-50 text-sm font-sans tracking-wide">Initializing view...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-40 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                                            <Plus className="rotate-45" size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold">No File Content</h3>
                                        <p className="text-base opacity-60 font-sans max-w-sm">This book entry was found, but the actual file data is missing or couldn't be loaded.</p>
                                        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-full font-sans text-sm font-semibold">Return Home</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI panel */}
                {aiModal && (
                    <AIModal 
                        setAiModal={setAiModal} 
                        bookTitle={book?.title || book?.file?.name} 
                        selectedText={selection.text}
                    />
                )}
            </div>
        </div>
    );
}

export default ReaderView;
