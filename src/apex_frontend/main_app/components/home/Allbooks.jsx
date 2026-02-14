import React from 'react';
import { Heart, Share2, Bookmark } from "lucide-react";

export default function Allbooks({ books, onBookClick }) { // Accept props!
    
    // Status color helper
    const statusStyles = {
        uncompleted: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-green-100 text-green-700',
        new: 'bg-indigo-100 text-indigo-700',
    };

    if (!books || books.length === 0) {
        return <div className="p-5 text-center text-gray-500">No books found in this category.</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-0 p-3 divide-y-2 divide-border-default pb-20">
            {books.map((book) => (
                <div key={book.id} onClick={() => onBookClick(book.id)} className="group relative flex flex-col p-1 pt-5 transition-shadow duration-300 cursor-pointer">
                    <div className="flex flex-row gap-4">
                        {/* Cover - Left Side */}
                        <div className="relative w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Status Badge */}
                            <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status] || 'bg-gray-100'}`}>
                                {book.status}
                            </span>
                        </div>

                        {/* Info - Right Side */}
                        <div className="flex-1 flex-col flex justify-between">
                            <div className="book-content flex flex-col">
                                <h3 className="font-semibold text-xl font-display text-text-primary line-clamp-2 mb-1">{book.title}</h3>
                                <p className="text-sm text-black/50 mb-3">{book.author}</p>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${book.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-black/50 mt-1">{book.progress}% complete</p>
                            </div>
                            
                            <div className="icon">
                                <div className="flex justify-end gap-3 pt-2 mt-auto">
                                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Heart size={18} />
                                    </button>
                                    <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                        <Share2 size={18} />
                                    </button>
                                    <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                        <Bookmark size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
