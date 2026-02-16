import React from 'react';
import { Bookmark, Plus, Heart, Share2, Eye } from 'lucide-react';
import BookCard from '../books/BookCard';

const statusStyles = {
    literature: 'bg-blue-100 text-blue-600',
    science: 'bg-green-100 text-green-600',
    commerce: 'bg-purple-100 text-purple-600',
    new: 'bg-orange-100 text-orange-600',
    completed: 'bg-indigo-100 text-indigo-600',
    uncompleted: 'bg-amber-100 text-amber-600',
};

export default function Allbooks({ books, onBookClick }) {
    return (
        <section className='all-book-section py-4'>
            <h2 className='text-xl px-4 font-medium mb-4 font-display'>All Books</h2>
            
            {!books || books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
                        <Bookmark size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No library found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        Your collection is currently empty. Tap the <span className="p-1.5 bg-accent-primary text-white rounded-lg inline-flex items-center justify-center scale-75 mx-0.5"><Plus size={14} /></span> button below to upload your first PDF.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))] border-t-2 border-l-2 border-border-default mx-3">
                    {books.map((book) => (
                        <div key={book.id} className="border-r-2 border-b-2 border-border-default p-2">
                            <BookCard 
                                book={book} 
                                onClick={onBookClick} 
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
