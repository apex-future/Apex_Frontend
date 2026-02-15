import React from 'react';
import BookCard from '../books/BookCard';

export default function Allbooks({ books, onBookClick }) {
    if (!books || books.length === 0) {
        return <div className="p-5 text-center text-gray-500">No books found in this category.</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-0 p-3 divide-y-2 divide-border-default pb-20">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    onClick={onBookClick}
                />
            ))}
        </div>
    );
}
