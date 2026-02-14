import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Bookmark, Share2 } from 'lucide-react';

function ReaderView({ books = [] }) {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = React.useState(null);
    const [textContent, setTextContent] = React.useState("");

    // Find the book by ID
    const book = books.find(b => b.id.toString() === bookId);

    // Redirect home if book is missing
    useEffect(() => {
        if (!book) navigate('/');
    }, [book, navigate]);

    // Set demo content for starter books
    const getDemoContent = (id) => {
        const idNum = parseInt(id);
        if (idNum === 1) return `<h1 class="text-4xl font-bold mb-8">Chapter 1: The Surprising Power of Atomic Habits</h1><p class="mb-6">Success is the product of daily habits—not once-in-a-lifetime transformations. You do not rise to the level of your goals. You fall to the level of your systems.</p><p class="mb-6">Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.</p><p>As you repeat these small habits of 1% improvement every day, the results will eventually be massive.</p>`;
        if (idNum === 2) return `<h1 class="text-4xl font-bold mb-8">Chapter 1: The Study of Life</h1><p class="mb-6">Biology is the natural science that studies life and living organisms, including their physical structure, chemical processes, molecular interactions, physiological mechanisms, development and evolution.</p><p class="mb-6">Despite the complexity of the science, certain unifying concepts consolidate it into a single, coherent field. Biology recognizes the cell as the basic unit of life, genes as the basic unit of heredity, and evolution as the engine that propels the creation and extinction of species.</p>`;
        if (idNum === 3) return `<h1 class="text-4xl font-bold mb-8">Accounting Fundamentals</h1><p class="mb-6">Accounting is the process of recording financial transactions pertaining to a business. The accounting process includes summarizing, analyzing, and reporting these transactions to oversight agencies, regulators, and tax collection entities.</p><p>The financial statements used in accounting are a concise summary of financial transactions over an accounting period, summarizing a company's operations, financial position, and cash flows.</p>`;
        return "";
    };

    const demoContent = getDemoContent(bookId);

    // Process the file if it exists
    useEffect(() => {
        window.scrollTo(0, 0);

        if (book?.file) {
            const fileName = book.file.name.toLowerCase();

            if (fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
                const url = URL.createObjectURL(book.file);
                setFileUrl(url);
                setTextContent("");
            }
            else if (fileName.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => setTextContent(e.target.result);
                reader.readAsText(book.file);
                setFileUrl(null);
            }
        }

        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [book]);

    if (!book) return null;

    const isPdf = book.file?.name.toLowerCase().endsWith('.pdf');

    return (
        <div className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-serif selection:bg-accent-primary/20 flex flex-col relative overflow-hidden">
            {/* Mesh Gradient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-subtle/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Toolbar - Modern Glassmorphism */}
            <header className="fixed top-4 left-4 right-4 bg-white/40 backdrop-blur-2xl border border-white/40 px-4 py-3 flex items-center justify-between z-50 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-300 active:scale-95 text-gray-700"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-display font-bold text-sm sm:text-base tracking-tight line-clamp-1">{book.title}</h1>
                        <p className="font-sans text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{book.author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                    <button className="p-2 hover:bg-white/60 rounded-lg transition-colors hidden sm:block"><Bookmark size={18} /></button>
                    <button className="p-2 hover:bg-white/60 rounded-lg transition-colors hidden sm:block"><Settings size={18} /></button>
                    <button className="p-2 hover:bg-white/60 rounded-lg transition-colors"><Share2 size={18} /></button>
                    <div className="w-px h-6 bg-gray-200/50 mx-1 hidden sm:block" />
                    <button className="px-4 py-2 bg-accent-primary text-white rounded-xl text-xs font-bold font-sans shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 transition-all active:scale-95">
                        Ask Apex
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 w-full mx-auto pb-32 pt-28">
                {fileUrl ? (
                    isPdf ? (
                        <div className="h-[calc(100vh-180px)] px-2 sm:px-6">
                            <iframe
                                src={`${fileUrl}#toolbar=0`}
                                className="w-full h-full border border-white/20 rounded-3xl shadow-2xl bg-white/20 backdrop-blur-sm"
                                title="PDF Reader"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center p-4">
                            <img src={fileUrl} alt="uploaded content" className="max-w-full rounded-3xl shadow-2xl border-4 border-white/50" />
                        </div>
                    )
                ) : (
                    <div className="max-w-3xl mx-auto px-8 sm:px-12 py-8 leading-[1.8] text-xl sm:text-2xl tracking-normal text-gray-800 antialiased">
                        {demoContent ? (
                            <div
                                className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out fill-mode-both"
                                dangerouslySetInnerHTML={{ __html: demoContent }}
                            />
                        ) : textContent ? (
                            <div className="whitespace-pre-wrap animate-in fade-in duration-1000">{textContent}</div>
                        ) : (
                            <div className="text-center py-40 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full border-t-2 border-accent-primary animate-spin mb-4" />
                                <p className="opacity-50 italic">Generating immersive view...</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Progress Bar - High-End Aesthetic */}
            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-[500px] bg-[#1a1a1a]/90 backdrop-blur-2xl px-6 py-4 flex flex-col gap-3 rounded-[24px] shadow-2xl z-50 border border-white/10 group overflow-hidden">
                {/* Subtle shine effect */}
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:left-[100%] transition-all duration-[1.5s] ease-in-out pointer-events-none" />

                <div className="flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-gray-400">
                    <span className="text-accent-primary brightness-125">
                        {fileUrl ? 'Interactive Document' : 'Immersive Reading'}
                    </span>
                    <span>{book.currentPage} / {book.totalPages} pages</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                        <div
                            className="absolute top-0 left-0 bg-gradient-to-r from-accent-primary to-accent-subtle h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                            style={{ width: `${book.progress}%` }}
                        />
                    </div>
                    <span className="font-sans font-black text-white text-sm tabular-nums tracking-tighter w-8">{book.progress}%</span>
                </div>
            </footer>
        </div>
    );
}

export default ReaderView;
