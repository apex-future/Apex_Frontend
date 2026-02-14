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

    // Redirect home if book is missing (cleaner than error screen)
    useEffect(() => {
        if (!book) navigate('/');
    }, [book, navigate]);

    // Set demo content for starter books
    const getDemoContent = (id) => {
        const idNum = parseInt(id);
        if (idNum === 1) return `<h1>Chapter 1: The Surprising Power of Atomic Habits</h1><p>Success is the product of daily habits—not once-in-a-lifetime transformations. You do not rise to the level of your goals. You fall to the level of your systems.</p><p>Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.</p>`;
        if (idNum === 2) return `<h1>Chapter 1: The Study of Life</h1><p>Biology is the natural science that studies life and living organisms, including their physical structure, chemical processes, molecular interactions, physiological mechanisms, development and evolution.</p><p>Despite the complexity of the science, certain unifying concepts consolidate it into a single, coherent field.</p>`;
        if (idNum === 3) return `<h1>Accounting Fundamentals</h1><p>Accounting is the process of recording financial transactions pertaining to a business. The accounting process includes summarizing, analyzing, and reporting these transactions to oversight agencies, regulators, and tax collection entities.</p>`;
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
        <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-serif flex flex-col">
            {/* Top Toolbar */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-display font-bold text-sm sm:text-base line-clamp-1">{book.title}</h1>
                        <p className="font-sans text-xs text-gray-500">{book.author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Bookmark size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Settings size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Share2 size={20} /></button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 w-full mx-auto pb-20 pt-20">
                {fileUrl ? (
                    isPdf ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-[calc(100vh-120px)] border-none"
                            title="PDF Reader"
                        />
                    ) : (
                        <div className="flex justify-center p-4">
                            <img src={fileUrl} alt="uploaded content" className="max-w-full rounded-lg shadow-xl" />
                        </div>
                    )
                ) : (
                    <div className="max-w-2xl mx-auto px-6 py-10 leading-relaxed text-lg sm:text-xl">
                        {demoContent ? (
                            <div className="prose prose-slate" dangerouslySetInnerHTML={{ __html: demoContent }} />
                        ) : textContent ? (
                            <div className="whitespace-pre-wrap">{textContent}</div>
                        ) : (
                            <div className="text-center opacity-50 italic py-20">
                                No content available for this document.
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Progress Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between font-sans text-xs text-gray-500 z-50 shadow-lg">
                <span className="font-medium text-accent-primary uppercase tracking-wider">
                    {fileUrl ? 'Original Document' : 'Reading Mode'}
                </span>
                <div className="flex items-center gap-4">
                    <div className="w-24 sm:w-32 bg-gray-200 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-accent-primary h-full transition-all duration-500"
                            style={{ width: `${book.progress}%` }}
                        />
                    </div>
                    <span className="font-bold">{book.progress}%</span>
                </div>
                <span className="hidden xs:inline">{book.currentPage} of {book.totalPages} pages</span>
            </footer>
        </div>
    );
}

export default ReaderView;
