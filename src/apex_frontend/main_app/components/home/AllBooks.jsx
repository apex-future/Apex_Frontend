import React from 'react';
import { Bookmark } from 'lucide-react';
import BookCard from '../books/BookCard';

export default function AllBooks({ books = [], onBookClick }) {

    return (
        <section className='all-book-section py-4 px-4'>
            <div className="flex justify-between items-center mb-6">
                <h2 className='text-2xl font-bold font-display text-text-primary'>Your Library</h2>
                <span className="text-sm text-text-tertiary bg-bg-subtle px-3 py-1 rounded-full">
                    {books.length} {books.length === 1 ? 'Book' : 'Books'}
                </span>
            </div>

            {(!books || books.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card-glass rounded-3xl border-2 border-dashed border-border-default">
                    <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
                        <Bookmark size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Your library is empty</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        Ready to start reading? Upload your first book.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8 transition-all duration-300">
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
