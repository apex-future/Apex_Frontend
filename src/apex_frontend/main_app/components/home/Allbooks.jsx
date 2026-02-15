import React from 'react';
import { Bookmark, Plus, Heart, Share2 } from 'lucide-react';
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
    if (!books || books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
                    <Bookmark size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No library found</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-8">
                    Your collection is currently empty. Tap the <span className="p-1.5 bg-accent-primary text-white rounded-lg inline-flex items-center justify-center scale-75 mx-0.5"><Plus size={14} /></span> button below to upload your first PDF.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-0 p-3 divide-y-2 divide-border-default">
            {books.map((book) => (
                <div key={book.id} className="flex flex-col  p-1 pt-5  transition-shadow duration-300 ">
            
                  
                    <div className="flex flex-row gap-4 ">
                        {/* Cover - Left Side */}
                        <div className="relative w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Status Badge */}
                            <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status]}`}>
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
                                <div className="flex justify-end gap-3 pt-2  mt-auto">
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

                    {/* Icon Footer */}
         
                </div>
            ))}
        </div>
    );
}
