import React, { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContext';
import { ArrowLeft,Heart,Share2,MoreHorizontal,Bookmark,Pen,Star,CheckCircle2,Trash2 } from 'lucide-react';

import BookCover from './BookCover';

function BookDetails() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { books } = useContext(BookContext);

    // Find the book by converting ID to string for comparison (as useParams returns strings)
    const book = books.find(b => String(b.id) === bookId);
    
    if (!book) {
        return (
            <div className="p-8 text-center text-gray-500 min-h-[50vh] flex flex-col items-center justify-center">
                <p className="text-xl font-medium mb-4">Book not found</p>
                <button 
                    onClick={() => navigate('/')} 
                    className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="relative flex justify-between items-center py-4 px-2">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-all group"
                >
                    <ArrowLeft size={20} className="text-text-secondary group-hover:-translate-x-1 transition-transform" /> 
                </button>
                
                <h3 className='text-lg font-bold text-text-primary tracking-tight'>Book Details</h3>
                
                <div className="w-9" />
            </div>
            
           
            
            <div className="flex flex-col pt-8 items-start">
                <div className="book-header flex md:flex-row gap-8 lg:gap-12 flex-col w-full mb-12">
                    <div className='img-wrapper flex flex-col items-center justify-start gap-6'>
                        <div className="w-60 h-80 sm:w-64 sm:h-84 flex-shrink-0 rounded-2xl overflow-hidden mx-auto md:mx-0 border-4 border-white shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                            {book.cover ? (
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <BookCover title={book.title} author={book.author} className="w-full h-full" />
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="bg-accent-subtle text-accent-pressed text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                {book.status || 'Library'}
                            </span>
                            <span className="bg-neutral-100 text-text-tertiary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                {Math.round(book.progress || 0)}% Completed
                            </span>
                        </div>
                    </div>




                    <div className="book-main-info flex flex-col gap-8 md:w-full">
                        <div className="book-title">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display text-text-primary mb-3 tracking-tightest leading-premium-tight">
                                {book.title}
                            </h1>
                            <p className="text-base sm:text-lg text-text-tertiary font-medium tracking-tight italic">by {book.author}</p>
                        </div>
                
                        <div className="max-w-2xl">
                            <h2 className="text-xs sm:text-sm font-bold text-text-placeholder uppercase tracking-[0.2em] mb-4">About this book</h2>
                            <div className="bg-white border border-border-default rounded-2xl p-6 sm:p-8 hover:border-accent-primary/10 hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-500 text-text-secondary leading-premium-relaxed text-sm sm:text-base">
                                {book.description || "No description available for this title."}
                            </div>
                        </div>

                        <div className="book-actions flex gap-2 p-1 flex-col">
                            
                            <div className="book-icons">
        <button className="p-3 text-gray-400 rounded-x hover:text-red-500 hover:border-red-100 transition-all">
                                <Heart size={20} />
                            </button>
                                <button className="p-3 text-gray-400 rounded-x hover:text-red-500 hover:border-red-100 transition-all">
                                <CheckCircle2 size={20} />
                            </button>
                               
                                <button className="p-3 text-gray-400 rounded-x hover:text-red-500 hover:border-red-100 transition-all">
                                <Bookmark size={20} />
                            </button>
                            <button className="p-3 text-gray-400 rounded-x hover:text-red-500 hover:border-red-100 transition-all">
                                <Share2 size={20} />
                            </button>
                             <button className="p-3 text-gray-400 rounded-x hover:text-red-500 hover:border-red-100 transition-all">
                                <Trash2 size={20} />
                            </button>
                            </div>
 <div className="">
                            <button 
                                onClick={() => navigate(`/reader/${book.id}`)}
                                className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-0.5 transition-all"
                            >
                                Continue Reading
                            </button>
                            </div>                    
                        
                        </div>
                    </div>
                </div>
             
                
                <div className="flex-1">
           
                    
               
                    
                    <div className="space-y-8">
                   

                        {/* <div className="flex gap-4 p-1">
                            <button 
                                onClick={() => navigate(`/reader/${book.id}`)}
                                className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-0.5 transition-all"
                            >
                                Continue Reading
                            </button>
                            <button className="p-3 bg-white border border-border-default text-gray-400 rounded-xl hover:text-red-500 hover:border-red-100 transition-all">
                                <Heart size={24} />
                            </button>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookDetails;
