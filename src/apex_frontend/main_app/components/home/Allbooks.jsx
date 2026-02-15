import React, { useContext } from 'react';
// Import BookContext to access global book data
import { BookContext } from "../../context/BookContext";
// Import Lucide icons for UI actions
import { Heart, Share2, Bookmark } from "lucide-react";

/**
 * Allbooks Component:
 * Displays a list of all available books in a grid layout.
 * Consumes book data from the global BookContext.
 */
export default function Allbooks() {
    // Destructure 'books' from BookContext. These are provided by BookProvider in MainApp.jsx.
    const { books } = useContext(BookContext);

    /**
     * statusStyles: Mapping object for book categories/status to CSS classes.
     * Provides consistent thematic styling for different genres.
     */
    const statusStyles = {
        Literature: 'bg-white text-black border border-gray-200',
        Science: 'bg-black text-white',
        Commerce: 'bg-black text-white',
    };

    return (
        // Grid Container: responsive columns (1 on mobile, 2 on md+) with spacing
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-0 p-3 divide-y-2 divide-border-default">
            {/* Iterate through the book list provided by context */}
            {books.map((book) => (
                <div key={book.id} className="group relative flex flex-col  p-1 pt-5  transition-shadow duration-300 ">
                    {/* Inner Flex Container: Separates Cover (Left) and Details (Right) */}
                    <div className="flex flex-row gap-4 ">
                        
                        {/* Cover Image Container */}
                        <div className="relative w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Badges: Dynamic styling based on book status/category */}
                            <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status]}`}>
                                {book.status}
                            </span>
                        </div>

                        {/* Book Information Section */}
                        <div className="flex-1 flex-col flex justify-between">
                            <div className="book-content flex flex-col">
                                <h3 className="font-semibold text-xl font-display text-text-primary line-clamp-2 mb-1">{book.title}</h3>
                                <p className="text-sm text-black/50 mb-3">{book.author}</p>

                                {/* Reading Progress Indicator */}
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${book.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-black/50 mt-1">{book.progress}% complete</p>
                            </div>
                            
                            {/* Interaction Icons Footer */}
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
                </div>
            ))}
        </div>
    );
}