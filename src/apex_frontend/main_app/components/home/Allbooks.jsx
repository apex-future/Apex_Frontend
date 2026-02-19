import React, { useMemo } from 'react';
import { Bookmark, Plus } from 'lucide-react';
import BookCard from '../books/BookCard';

export default function Allbooks({ books = [], onBookClick }) {
    // Debug: Log books count (will show in user's browser console)
    console.log("Rendering Allbooks with:", books?.length, "books");

    return (
        <section className='all-book-section py-4 px-4'>
            <div className="flex justify-between items-center mb-6">
                <h2 className='text-2xl font-bold font-display text-text-primary'>Your Library</h2>
                <span className="text-sm text-text-tertiary bg-bg-subtle px-3 py-1 rounded-full">
                    {books.length} {books.length === 1 ? 'Book' : 'Books'}
                </span>
            </div>

            {(!books || books.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white/50 rounded-3xl border-2 border-dashed border-border-default">
                    <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
                        <Bookmark size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Your library is empty</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        Upload some PDFs to start building your collection.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book) => (
                        <div key={book.id} className="h-full">
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
