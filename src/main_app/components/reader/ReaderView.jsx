import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import PDFReader from './PDFReader';
import ReaderNavBar from './ReaderNavBar';
import AIModal from './reading_navigations/reading_layout/AIModal';
import HighlightMenu from './HighlightMenu';
import LeftPanel from './reading_navigations/reading_layout/LeftPanel';
import BookSkeleton from './BookSkeleton';
import { ChevronLeft, ChevronRight, Plus, Menu, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

const ScrollOrientationOverlay = ({ visible }) => {
    if (!visible) return null;
    return (
        <div className="fixed inset-x-0 bottom-32 z-[100] flex items-center justify-center pointer-events-none lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-white/20 text-black shadow-2xl">
                <ArrowLeft size={18} className="opacity-70" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Swipe left or right</span>
                <ArrowRight size={18} className="opacity-70" />
            </div>
        </div>
    );
};

function ReaderView() {
    const { books, updateBookProgress, toggleBookmark, addSavedWord, addHighlight, downloadMissingFile } = useContext(BookContext);
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

    // Deep loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Setting up file");
    const [downloadError, setDownloadError] = useState(false);

    const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [isDictOpen, setIsDictOpen] = useState(false);

    const handleHighlight = (color) => {
        if (!book || !selection.text) return;
        addHighlight(book.id, {
            text: selection.text,
            color,
            page: pageNumber,
            addedAt: new Date().toISOString()
        });
        setShowHighlightMenu(false);
        // Clear browser selection
        window.getSelection().removeAllRanges();
    };

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
        // If text is selected, don't toggle nav — let the highlight menu handle it
        if (window.getSelection().toString().trim()) return;
        setNavState(prev => prev === 'none' ? 'first' : 'none');
    }, []);

    const closeNav = useCallback(() => {
        setNavState('none');
    }, []);

    // Override native context menu on mobile so our HighlightMenu is used instead
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        const handleContextMenu = (e) => {
            // Only suppress when inside the reader and there's a text selection
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu, { passive: false });
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Touch Gesture State
    const touchState = useRef({
        initialDist: 0,
        initialScale: 1.0,
        isPinching: false
    });

    // Selection monitoring logic
    useEffect(() => {
        const handleSelectionChange = () => {
            const activeSel = window.getSelection();
            const text = activeSel.toString().trim();

            if (text && text.length > 0) {
                try {
                    const range = activeSel.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    setSelection({
                        text,
                        x: rect.left + rect.width / 2,
                        y: rect.top
                    });
                    setShowHighlightMenu(true);
                } catch (e) {
                    // If selection range is lost or invalid
                    setShowHighlightMenu(false);
                }
            } else {
                // Only hide if dictionary isn't open
                if (!isDictOpen) {
                    setShowHighlightMenu(false);
                }
            }
        };

        const getDistance = (touches) => {
            return Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY
            );
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                touchState.current.isPinching = true;
                touchState.current.initialDist = getDistance(e.touches);
                touchState.current.initialScale = scale;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && touchState.current.isPinching) {
                e.preventDefault();
                const currentDist = getDistance(e.touches);
                const ratio = currentDist / touchState.current.initialDist;
                const newScale = Math.min(Math.max(touchState.current.initialScale * ratio, 0.5), 2.5);
                setScale(newScale);
            }
        };

        const handleTouchEnd = (e) => {
            if (e.touches.length < 2) {
                touchState.current.isPinching = false;
                handleSelectionChange();
            }
        };

        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [scale, isDictOpen]);

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

        // Handle cloud download if file is missing locally
        if (book && !book.file && (book.supabaseId || book.recordId)) {
            setLoadingMessage("Downloading from cloud...");
            downloadMissingFile(book.id).then(downloadedFile => {
                if (!downloadedFile) {
                    setLoadingMessage(navigator.onLine 
                        ? "Failed to load book from the cloud." 
                        : "Connect to internet to download this book.");
                    setDownloadError(true);
                    setIsLoading(false);
                }
            });
            return;
        }

        const file = book?.file;
        if (file) {
            const isTypePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isTypeImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
            const isTypeText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

            if (isTypePdf || isTypeImage) {
                const url = URL.createObjectURL(file);
                Promise.resolve().then(() => {
                    setFileUrl(url);
                    setTextContent("");
                });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId, book?.file, navigate]);

    // Loading Sequence Animation
    const [showMenuBriefly, setShowMenuBriefly] = useState(false);
    const [showScrollOverlay, setShowScrollOverlay] = useState(false);

    useEffect(() => {
        if (!isLoading) return;

        const messages = ["Setting up file", "Loading all pages", "Finalizing load", "Rendering"];
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < messages.length - 1) {
                currentIndex++;
                setLoadingMessage(messages[currentIndex]);
            }
        }, 800);

        // Completion logic - wait for bit after "Rendering"
        const finalTimer = setTimeout(() => {
            if (book?.file) {
                 setIsLoading(false);
                 // Trigger UX effects - Slide menu out and show overlay
                 setShowMenuBriefly(true);
                 setShowScrollOverlay(true);
                 
                 // Retract menu after 3 seconds
                 setTimeout(() => setShowMenuBriefly(false), 3000);
                 // Hide overlay after 3 seconds
                 setTimeout(() => setShowScrollOverlay(false), 3000);
            }
        }, messages.length * 800 + 400);

        return () => {
            clearInterval(interval);
            clearTimeout(finalTimer);
        };
    }, [isLoading, book?.file]);


    const lastBookIdRef = useRef(null);
    useEffect(() => {
        if (!bookId || !book || lastBookIdRef.current === bookId) return;
        lastBookIdRef.current = bookId;
        window.scrollTo(0, 0);
        Promise.resolve().then(() => {
            setLocalProgress(book.progress || 0);
            setLocalPages({ current: book.currentPage || 1, total: book.totalPages || 1 });
            setPageNumber(book.currentPage || 1);
        });
    }, [bookId, book]);

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

    if (downloadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 relative p-8 font-sans">
               <div className="absolute top-6 left-6 z-10">
                   <button 
                       onClick={() => navigate('/')} 
                       className="p-3 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-accent-primary hover:border-purple-200 transition-all font-bold text-sm tracking-wide flex items-center gap-2 group"
                   >
                       <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Library
                   </button>
               </div>
               <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-sm w-full text-center flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 fade-in duration-500">
                   <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                       <AlertCircle size={32} />
                   </div>
                   <div className="space-y-2">
                       <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Download Error</h2>
                       <p className="text-sm font-medium text-slate-500">{loadingMessage}</p>
                   </div>
                   <button 
                       onClick={() => window.location.reload()} 
                       className="w-full py-4 rounded-xl bg-accent-primary hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2"
                   >
                       <Menu size={18} /> Try Again
                   </button>
               </div>
            </div>
        );
    }

    if (!book) return null;

    if (isLoading) {
        return <BookSkeleton message={loadingMessage} />;
    }

    return (
        <div
            className="h-[100dvh] max-h-[100dvh] w-screen bg-[#faf9f6] text-[#1a1a1a] font-serif selection:bg-blue-200/50 relative overflow-hidden"
            onClick={closeNav}
        >
            <ScrollOrientationOverlay visible={showScrollOverlay} />
            {/* Subtle Menu Trigger - Persistent at top */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleNav(); }}
                    className={`group hover:bg-white/90 backdrop-blur-md border border-slate-200/50 px-4 py-1.5 rounded-b-2xl transition-all duration-700 hover:translate-y-0 flex items-center gap-2 shadow-sm ${showMenuBriefly ? 'translate-y-0 bg-white shadow-md' : 'bg-white/40 border-slate-200/30 -translate-y-[80%]'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${showMenuBriefly ? 'bg-accent-primary' : 'bg-slate-300 group-hover:bg-blue-500'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showMenuBriefly ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>Menu</span>
                    <Menu size={12} className={`transition-colors ${showMenuBriefly ? 'text-slate-500' : 'text-slate-300 group-hover:text-slate-600'}`} />
                </button>
            </div>

            <div className="flex h-full max-h-full overflow-hidden relative">
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
                        bookId={book?.id}
                        onSaveWord={addSavedWord}
                        onHighlight={handleHighlight}
                        onDictToggle={setIsDictOpen}
                    />
                )}

                {/* Main reading area */}
                <div className="flex-1 relative min-w-0 flex flex-col h-full max-h-full overflow-hidden">

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
                                numPages={numPages}
                                goToPage={goToPage}
                                highlights={book?.metadata?.highlights || []}
                                locked={locked}
                                windowSize={windowSize}
                            />

                            <button
                                onClick={(e) => { e.stopPropagation(); previousPage(); }}
                                disabled={pageNumber <= 1}
                                className="md:flex hidden absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[80] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/95 hover:bg-white backdrop-blur-xl border border-slate-200/50 text-slate-700 hover:text-blue-600 transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                title="Previous page"
                            >
                                <ChevronLeft size={28} strokeWidth={2.5} className="-ml-1" />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); nextPage(); }}
                                disabled={pageNumber >= (numPages || 1)}
                                className="md:flex hidden absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[80] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/95 hover:bg-white backdrop-blur-xl border border-slate-200/50 text-slate-700 hover:text-blue-600 transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                title="Next page"
                            >
                                <ChevronRight size={28} strokeWidth={2.5} className="ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Image content */}
                    {fileUrl && !isPdf && (
                        <div className="flex-1 flex flex-col items-center justify-center lg:justify-start overflow-auto p-4 sm:p-8">
                            <img src={fileUrl} alt="content" className="max-w-full max-h-[90vh] object-contain rounded-sm bg-white" />
                        </div>
                    )}

                    {/* Text content */}
                    {!fileUrl && (
                        <div className="flex-1 overflow-auto h-full touch-auto flex flex-col items-center justify-center lg:justify-start">
                            <div 
                                className="max-w-3xl w-full mx-auto px-8 sm:px-12 py-12 lg:py-24 leading-[1.8] text-xl sm:text-2xl text-gray-800 antialiased"
                                style={{ 
                                    transform: `scale(${scale})`, 
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}
                            >
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
                        bookId={book?.id?.toString()}
                    />
                )}
            </div>
        </div>
    );
}

export default ReaderView;
