import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Eye, Bookmark, Trash, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import ConfirmModal from '../ui/ConfirmModal';
import { BookContext } from '../../context/BookContextInstance';
import useSpaceStore from '../../store/spaceStore';

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
    const { spaces, addBookToSpace, removeBookFromSpace } = useSpaceStore();

    // State for modals
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSpaceModal, setShowSpaceModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

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
        // Pre-fill with current spaces the book is in
        const currentIds = [];
        if (book.isBookmarked) currentIds.push('general');
        spaces.filter(s => !s.isSystem).forEach(s => {
            if (s.bookIds.includes(book.id)) currentIds.push(s.id);
        });
        setSelectedIds(currentIds);
        setShowSpaceModal(true);
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleConfirmAddToSpace = async () => {
        // Sync Bookmark state
        const shouldBeBookmarked = selectedIds.includes('general');
        if (shouldBeBookmarked !== book.isBookmarked && toggleBookmarkedBook) {
            toggleBookmarkedBook(book.id);
        }

        // Sync Custom Spaces
        for (const space of spaces.filter(s => !s.isSystem)) {
            const wasIn = space.bookIds.includes(book.id);
            const shouldBeIn = selectedIds.includes(space.id);
            
            if (shouldBeIn && !wasIn) {
                await addBookToSpace(space.id, book.id);
            } else if (!shouldBeIn && wasIn) {
                await removeBookFromSpace(space.id, book.id);
            }
        }
        
        setShowSpaceModal(false);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        // Show confirmation modal — never delete directly without confirmation
        setShowDeleteModal(true);
    };

    return (
        <div
            onClick={() => onClick && onClick(book.id)}
            className="group relative flex flex-col p-4 bg-card-glass backdrop-blur-md border border-border-default rounded-card transition-all duration-300 cursor-pointer hover:border-text-tertiary  shadow-sm"
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

                    {/* Uploading overlay — shows while book is being uploaded to Supabase */}
                    {book.isUploading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg gap-1">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white text-[9px] font-bold uppercase tracking-wider">Uploading</span>
                      </div>
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
                    console.log('[Apex] User confirmed book delete for bookId:', book.id, '| supabaseId:', book.supabaseId);
                    // Pass full book object as fallback in case Dexie record has shifted ID after pull sync
                    if (deleteBookFromShelves) deleteBookFromShelves(book.id, book);
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

            {/* Save to Space Modal */}
            {showSpaceModal && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={(e) => { e.stopPropagation(); setShowSpaceModal(false); }}
                >
                    <div 
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-100 dark:border-neutral-800 flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 font-display">Save to Space</h3>
                            <button 
                                onClick={() => setShowSpaceModal(false)} 
                                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-3 max-h-[50vh] overflow-y-auto space-y-1 custom-scrollbar">
                            {/* General Bookmarks */}
                            <div 
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group ${selectedIds.includes('general') ? 'bg-accent-primary/5 border border-accent-primary/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'}`}
                                onClick={() => toggleSelection('general')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${selectedIds.includes('general') ? 'bg-accent-primary/10 text-accent-primary' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                                        <Bookmark size={18} fill={selectedIds.includes('general') ? 'currentColor' : 'none'} />
                                    </div>
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-200 text-sm block">General Bookmarks</span>
                                </div>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedIds.includes('general') ? 'bg-accent-primary border-accent-primary' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-accent-primary/50'}`}>
                                    {selectedIds.includes('general') && <span className="text-white text-[10px] font-bold">✓</span>}
                                </div>
                            </div>

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2 mx-3" />

                            {/* Custom Spaces */}
                            {spaces.filter(s => !s.isSystem).map(space => {
                                const isSelected = selectedIds.includes(space.id);
                                return (
                                    <div 
                                        key={space.id}
                                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group ${isSelected ? 'bg-accent-primary/5 border border-accent-primary/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'}`}
                                        onClick={() => toggleSelection(space.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold uppercase text-xs border border-indigo-100/50 dark:border-indigo-500/20">
                                                {space.name.substring(0, 2)}
                                            </div>
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-200 text-sm block">{space.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-accent-primary border-accent-primary' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-accent-primary/50'}`}>
                                            {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {spaces.filter(s => !s.isSystem).length === 0 && (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bookmark size={20} className="text-neutral-400" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No custom spaces yet</p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Create spaces to organize your library.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Action Button */}
                        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <button
                                onClick={handleConfirmAddToSpace}
                                className="w-full py-3.5 px-4 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-accent-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Bookmark size={18} fill="currentColor" />
                                <span>Add to Bookspace</span>
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
