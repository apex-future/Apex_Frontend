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
        <div className="  px-4 md:p- animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Page Header */}
                    <div className="relative flex justify-between items-center p-4">
                      {/* Back button placeholder */}
                
                                   <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                
            </button>
                      
                      <h3 className='text-lg font-semibold text-text-primary'>Book Details</h3>
                      
                      {/* Spacer for alignment */}
                      <div className="w-9" />
                    </div>
            
           
            
            <div className="flex flex-col pt-10  items-start">
                <div className="book-header  flex md:flex-row gap-12 flex-col w-full">

<div className='img-wrapper  flex flex-col items-center justify-center gap-2'>
                    <div className="w-64 h-80  flex-shrink-0 rounded-2xl overflow-hidden mx-auto md:mx-0 border-4 border-white transform hover:rotate-1 transition-transform duration-300">
                                {book.cover ? (
                                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                    <BookCover title={book.title} author={book.author} className="w-full h-full" />
                                )}


                            </div>

                                     <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {book.status || 'Library'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {Math.round(book.progress || 0)}% Completed
                        </span>
                    </div>
</div>




                         <div className="book-main-info md:w-full">
                        <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-2 leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-sm text-gray-400 font-medium ">by {book.author}</p>
                             <div className="flex-1 mt-6">
                            <h2 className="text-sm sm:text-base font-bold text-gray-500 uppercase tracking-widest mb-2">About this book</h2>
                            <div className="bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md border-2 border-border-default rounded-2xl p-4 hover:border-accent-primary/20 transition-all text-gray-700 leading-relaxed max-w-2xl">
                                {book.description || " No Description"}
                            </div>
                        </div>
                    </div>
                </div>
             
                
                <div className="flex-1">
           
                    
               
                    
                    <div className="space-y-8">
                   

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
