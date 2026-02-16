import React from 'react';
import { Heart, Eye, Bookmark } from "lucide-react";
import BookCover from './BookCover';

const statusStyles = {
    literature: 'bg-blue-100 text-blue-600',
    science: 'bg-green-100 text-green-600',
    commerce: 'bg-purple-100 text-purple-600',
    new: 'bg-orange-100 text-orange-600',
    completed: 'bg-indigo-100 text-indigo-600',
    uncompleted: 'bg-amber-100 text-amber-600',
};

export default function BookCard({ book, onClick }) {
    return (
        <div
            onClick={() => onClick && onClick(book.id)}
            className="group relative flex flex-col p-2 transition-shadow duration-300 cursor-pointer hover:bg-slate-50/50"
        >
            <div className="flex flex-row gap-4">
                {/* Cover - Left Side */}
                <div className="relative w-28 h-40 rounded-lg overflow-hidden shadow-sm bg-white flex-shrink-0">
                    {book.cover ? (
                        <img
                            src={book.cover}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:-rotate-6 transition-transform duration-300"
                        />
                    ) : (
                        <BookCover
                            title={book.title}
                            author={book.author}
                            className="w-full h-full group-hover:-rotate-6 transition-transform duration-300"
                        />
                    )}

                    {/* Status Badge */}
                    <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status] || 'bg-gray-100'}`}>
                        {book.status}
                    </span>
                </div>

                {/* Info - Right Side */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-xl font-display text-text-primary line-clamp-2 mb-1 group-hover:text-accent-primary transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-sm text-black/50 mb-3 text-left">by {book.author || "Unknown"}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                                className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                style={{ width: `${book.progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-black/50 mt-1 text-left">Page {book.currentPage || 0} of {book.totalPages || 0} completed</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 mt-auto text-gray-400">
                        <button className="hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}><Heart size={18} /></button>
                        <button className="hover:text-indigo-600 transition-colors" onClick={(e) => e.stopPropagation()}><Eye size={18} /></button>
                        <button className="hover:text-indigo-600 transition-colors" onClick={(e) => e.stopPropagation()}><Bookmark size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
