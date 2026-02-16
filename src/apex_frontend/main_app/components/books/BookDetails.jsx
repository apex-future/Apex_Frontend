import React, { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContext';
import { ArrowLeft,Heart } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center gap-2 text-gray-500 hover:text-accent-primary mb-10 transition-colors bg-white/50 px-4 py-2 rounded-full border border-border-default hover:border-accent-primary/50 shadow-sm"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="font-medium">Back to Library</span>
            </button>
            
            <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="w-64 h-80 flex-shrink-0 shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-white transform hover:rotate-1 transition-transform duration-300">
                    {book.cover ? (
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <BookCover title={book.title} author={book.author} className="w-full h-full" />
                    )}
                </div>
                
                <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {book.status || 'Library'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {Math.round(book.progress || 0)}% Completed
                        </span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-4 leading-tight">
                        {book.title}
                    </h1>
                    <p className="text-2xl text-gray-500 font-medium mb-10">by {book.author}</p>
                    
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About this book</h2>
                            <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-border-default shadow-sm text-gray-700 leading-relaxed max-w-2xl">
                                {book.description || "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort..."}
                            </div>
                        </div>

                        <div className="flex gap-4 p-1">
                            <button 
                                onClick={() => navigate(`/reader/${book.id}`)}
                                className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-0.5 transition-all"
                            >
                                Continue Reading
                            </button>
                            <button className="p-3 bg-white border border-border-default text-gray-400 rounded-xl hover:text-red-500 hover:border-red-100 transition-all">
                                <Heart size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookDetails;
