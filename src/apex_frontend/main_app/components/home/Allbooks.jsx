import React from 'react';
import { Bookmark, Plus } from 'lucide-react';
import BookCard from '../books/BookCard';

export default function Allbooks({ books, onBookClick }) {
    return (
        <section className='all-book-section py-4'>
            <h2 className='text-xl px-4 font-medium mb-4 font-display text-text-primary'>All Books</h2>

            {!books || books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
                        <Bookmark size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No library found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        Your collection is currently empty.
                        <span className="hidden md:inline"> Click the <span className="font-semibold text-accent-primary underline underline-offset-4 decoration-2">Upload</span> button above to get started.</span>
                        <span className="md:hidden"> Tap the <span className="p-1.5 bg-accent-primary text-white rounded-lg inline-flex items-center justify-center scale-75 mx-0.5"><Plus size={14} /></span> button below to upload your first PDF.</span>
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,390px),1fr))]  mx-3">
                    {books.map((book) => (
                        <div key={book.id} className="border-r-2  rounded-2xl  border-b-2 border-border-default p-2">
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
