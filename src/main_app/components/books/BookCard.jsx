import React, { useContext, useState } from 'react';
import { Heart, Eye, Bookmark, Trash } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import ConfirmModal from '../ui/ConfirmModal';
import { BookContext } from '../../context/BookContextInstance';

const statusStyles = {
    literature: 'bg-blue-100 text-blue-600',
    science: 'bg-green-100 text-green-600',
    commerce: 'bg-purple-100 text-purple-600',
    new: 'bg-orange-100 text-orange-600',
    completed: 'bg-indigo-100 text-indigo-600',
    uncompleted: 'bg-amber-100 text-amber-600',
};

export default function BookCard({ book, onClick }) {
    const navigate = useNavigate();
    const { toggleFavorite, toggleBookmarkedBook, deleteBookFromShelves } = useContext(BookContext) || {};

    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDetailsClick = (e) => {
        e.stopPropagation();
        navigate(`/book/${book.id}`);
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (toggleFavorite) toggleFavorite(book.id);
    };

    const handleBookmarkClick = (e) => {
        e.stopPropagation();
        if (toggleBookmarkedBook) toggleBookmarkedBook(book.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        // Show confirmation modal — never delete directly without confirmation
        setShowDeleteModal(true);
    };

    return (
        <div
            onClick={() => onClick && onClick(book.id)}
            className="group relative flex flex-col p-4 bg-card-glass backdrop-blur-md border border-border-default rounded-2xl transition-all duration-300 cursor-pointer hover:border-text-tertiary  shadow-sm"
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
                        <h3 className="font-semibold text-base sm:text-lg md:text-xl font-display text-text-primary truncate mb-1 group-hover:text-accent-primary transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-sm text-text-tertiary mb-3 text-left">by {book.author || "N/A"}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-border-default rounded-full h-1">
                            <div
                                className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                style={{ width: `${book.progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-tertiary mt-1 text-left">Page {book.currentPage || 0} of {book.totalPages || 0} completed</p>
                        {book.lastAccessed && (
                          <p className="text-[10px] text-text-placeholder mt-0.5 text-left">
                            Last read: {new Date(book.lastAccessed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 mt-auto text-gray-400">
                        <button
                            onClick={handleFavoriteClick}
                            className={`transition-colors ${book.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <Heart size={20} fill={book.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                            onClick={handleDetailsClick}
                        >
                            <Eye size={20} />
                        </button>
                        <button
                            onClick={handleBookmarkClick}
                            className={`transition-colors ${book.isBookmarked ? 'text-accent-primary' : 'text-gray-400 hover:text-accent-primary'}`}
                        >
                            <Bookmark size={20} fill={book.isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                            title="Delete book"
                        >
                            <Trash size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            <ConfirmModal
              isOpen={showDeleteModal}
              hideOverlay={true}
              title={`Delete "${book.title}"?`}
              message="This will permanently remove the book and all your highlights, bookmarks, and reading progress. This cannot be undone."
              onClose={() => setShowDeleteModal(false)}
              actions={[
                {
                  label: 'Delete',
                  variant: 'danger',
                  onClick: () => {
                    console.log('[Apex] User confirmed book delete for bookId:', book.id);
                    if (deleteBookFromShelves) deleteBookFromShelves(book.id);
                    setShowDeleteModal(false);
                  },
                },
                {
                  label: 'Cancel',
                  variant: 'ghost',
                  onClick: () => setShowDeleteModal(false),
                },
              ]}
            />
        </div>
    );
}
