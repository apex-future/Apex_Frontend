import React, { useEffect, useState, useRef, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContext';
import PDFReader from './PDFReader';
import ReaderNavBar from './ReaderNavBar';
import AIModal from './reading_navigations/reading_layout/AIModal';
import LeftPanel from './reading_navigations/reading_layout/LeftPanel';

function ReaderView() {
    const { books, updateBookProgress } = useContext(BookContext);
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState(null);
    const [textContent, setTextContent] = useState("");

    // Find the book and determine type
    const book = useMemo(() => books.find(b => b.id.toString() === bookId), [books, bookId]);
    const isPdf = useMemo(() => book?.file?.type === 'application/pdf' || book?.file?.name.toLowerCase().endsWith('.pdf'), [book]);

    // UI States
    const [localProgress, setLocalProgress] = useState(book?.progress || 0);
    const [localPages, setLocalPages] = useState({
        current: book?.currentPage || 1,
        total: book?.totalPages || 1
    });

    // Navigation Visibility State
    // States: 'none' | 'first' | 'second'
    const [navState, setNavState] = useState('none');
    const [aiModal, setAiModal] = useState(false);
    const [leftPanel, setLeftPanel] = useState(false);

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

        // Load the file content
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
    }, [bookId, book?.file]); // Only when file or ID changes

    // 2. Initial Reset effect
    useEffect(() => {
        if (!bookId) return;
        window.scrollTo(0, 0);
        // Initial sync from book data
        if (book) {
            setLocalProgress(book.progress || 0);
            setLocalPages({ current: book.currentPage || 1, total: book.totalPages || 1 });
        }
    }, [bookId]);

    // 3. Ultra-Stable Scroll Logic (Ref-Based)
    const lastUpdateRef = useRef(0);
    useEffect(() => {
        if (isPdf) return; // PDF Reader handles its own progress

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

            // Throttled Global Sync
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
        // Trigger calculation when content loads
        const timer = setTimeout(handleScroll, 500);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [bookId, textContent, fileUrl, isPdf]); // Only re-run if content changes

    if (!book) return null;

    return (
        <div
            className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-serif selection:bg-accent-primary/20 relative overflow-hidden"
            onClick={handleScreenClick}
        >
            {/* Always flex row — panels appear/disappear as flex siblings */}
            <div className="flex h-screen overflow-hidden">
                {/* Far-left panel — shown when Menu is clicked */}
                {leftPanel && <LeftPanel setLeftPanel={setLeftPanel} />}

                {/* Main reading area */}
                <div className="flex-1 relative min-w-0">
                    <ReaderNavBar
                        book={book}
                        navigate={navigate}
                        navState={navState}
                        setNavState={setNavState}
                        aiModal={aiModal}
                        setAiModal={setAiModal}
                        leftPanel={leftPanel}
                        setLeftPanel={setLeftPanel}
                    />
                </div>

                {/* AI panel — shown when Sparkles is clicked */}
                {aiModal && <AIModal setAiModal={setAiModal} />}
            </div>
            {/* <main className="flex-1 w-full mx-auto ">
                {fileUrl ? (
                    isPdf ? (
                        <div className="h-[calc(100vh-140px)] w-full flex flex-col">
                            <PDFReader 
                                fileUrl={fileUrl} 
                                initialPage={localPages.current}
                                onPageChange={(newPage, totalPages) => {
                                    setLocalPages({ current: newPage, total: totalPages || localPages.total });
                                    const newProgress = Math.round((newPage / (totalPages || 1)) * 100);
                                    setLocalProgress(newProgress);
                                    
                                    // Sync with backend
                                    if (book) {
                                        updateBookProgress(book.id, newProgress, newPage, totalPages);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center p-4">
                            <img src={fileUrl} alt="content" className="max-w-full rounded-3xl shadow-2xl border-4 border-white/50" />
                        </div>
                    )
                ) : (
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
                )}
            </main> */}

            {/* <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-[500px] bg-[#1a1a1a]/95 backdrop-blur-2xl px-6 py-4 flex flex-col gap-3 rounded-[24px] shadow-2xl z-50 border border-white/10 group transition-all duration-500 hover:scale-[1.02]">
                <div className="flex items-center justify-between text-[10px] font-sans font-black uppercase tracking-[0.25em] text-gray-400">
                    <span className="text-accent-primary brightness-125">{isPdf ? 'Interactive PDF' : 'Immersive Reading'}</span>
                    <span className="text-white/80 tabular-nums">{`Page ${localPages.current} / ${localPages.total}`}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-accent-primary to-accent-subtle h-full transition-all duration-700 ease-out" style={{ width: `${localProgress}%` }} />
                    </div>
                    <span className="font-sans font-black text-white text-xs tabular-nums w-8">{localProgress}%</span>
                </div>
            </footer> */}
        </div>
    );
}

export default ReaderView;
