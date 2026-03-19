import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookText } from 'lucide-react';
import BookCover from '../books/BookCover';

const LastReadCard = ({ book }) => {
    const navigate = useNavigate();
    if (!book) return null;

    const currentBook = book;
    
    return (
        <div 
            onClick={() => navigate(`/reader/${currentBook.id}`)}
            className="w-full bg-card-glass backdrop-blur-xl rounded-2xl md:rounded-3xl p-7 md:p-10 border-2 border-border-default hover:border-accent-primary/40 hover:shadow-2xl transition-all duration-500 group overflow-hidden cursor-pointer shadow-lg relative min-h-[180px] flex items-center"
        >
            {/* Design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent-primary/10 transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 size-32 bg-accent-primary/5 rounded-full blur-3xl" />
            
            <div className="flex gap-4 md:gap-8 w-full relative z-10 items-center">
                <div className="w-20 h-28 xs:w-28 xs:h-40 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-bg-subtle border border-border-default group-hover:scale-[1.05] transition-transform duration-500 ease-out flex items-center justify-center">
                    {currentBook.cover ? (
                        <img src={currentBook.cover} alt="Book cover" className="w-full h-full object-cover" />
                    ) : (
                        <BookCover title={currentBook.title} author={currentBook.author} className="w-full h-full flex items-center justify-center" />
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-1">
                    <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-primary/10 text-[10px] font-bold text-accent-primary uppercase tracking-widest mb-2 border border-accent-primary/20">
                            <BookText size={10} />
                            <span>Continue Reading</span>
                        </div>
                        <h2 className="font-display text-base xs:text-xl md:text-2xl font-bold text-text-primary mb-1 line-clamp-2 tracking-tight leading-tight group-hover:text-accent-primary transition-colors">
                            {currentBook.title}
                        </h2>
                        <p className="text-[11px] md:text-sm text-text-tertiary font-medium line-clamp-1 italic truncate">by {currentBook.author}</p>
                    </div>

                    <div className="space-y-4">
                        {/* Progress info */}
                        <div className="flex justify-between items-end gap-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-text-tertiary tracking-[0.15em] uppercase">Current Progress</span>
                                <span className="text-xs font-bold text-text-secondary">
                                    Page {currentBook.currentPage || 0} / {currentBook.totalPages || 0}
                                </span>
                            </div>
                            <span className="text-lg font-black text-accent-primary tabular-nums">
                                {currentBook.progress}%
                            </span>
                        </div>

                        {/* Pager / Screens Indicator - Bar 1 */}
                        <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                {/* Segmented background to represent 'screens' */}
                                {[...Array(10)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-1 h-full transition-colors duration-500 ${
                                            (i + 1) * 10 <= currentBook.progress 
                                                ? 'bg-accent-primary/40' 
                                                : 'bg-white/10'
                                        }`} 
                                    />
                                ))}
                            </div>

                            {/* Main Progress Bar - Bar 2 with White Highlight */}
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                                <div 
                                    className="absolute inset-y-0 left-0 bg-accent-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
                                    style={{ width: `${currentBook.progress}%` }}
                                />
                                {/* "A bit white to show where you are" - Glowing indicator */}
                                <div 
                                    className="absolute top-0 bottom-0 bg-white w-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-1000 ease-out"
                                    style={{ 
                                        left: `calc(${currentBook.progress}% - 3px)`, 
                                        opacity: currentBook.progress > 0 ? 1 : 0
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LastReadCard;
