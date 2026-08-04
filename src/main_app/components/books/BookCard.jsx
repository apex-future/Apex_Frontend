import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Eye, FolderSimplePlus, Trash, X, Info, PencilSimple, DotsThreeVertical, ShareNetwork } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import Modal from '../ui/Modal';
import ShareModal from '../ui/ShareModal';
import { BookContext } from '../../context/BookContextInstance';
import useSpaceStore from '../../store/spaceStore';
import useThemeStore from '../../store/themeStore';
import Card from '../ui/Card';

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
 const { resolvedTheme } = useThemeStore();
 const isInAnySpace = spaces.filter(s => !s.isSystem).some(s => s.bookIds.includes(book.id));

 // State for modals
 const [showMenu, setShowMenu] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showSpaceModal, setShowSpaceModal] = useState(false);
 const [showShareModal, setShowShareModal] = useState(false);
 const [selectedIds, setSelectedIds] = useState([]);
 const [syncPopover, setSyncPopover] = useState(null); // null | 'pending' | 'failed'

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
 // Close modal immediately so user doesn't see states change while syncing
 setShowSpaceModal(false);

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
 };

 const handleDeleteClick = (e) => {
 e.stopPropagation();
 // Show confirmation modal — never delete directly without confirmation
 setShowDeleteModal(true);
 };

 const handleShareClick = (e) => {
   e.stopPropagation();
   setShowMenu(false);
   setShowShareModal(true);
 };

 return (
 <>
 <Card
 onClick={() => onClick && onClick(book.id)}
 variant={onClick ? "interactive" : "default"}
 className="group relative flex flex-col p-4 transition-all duration-300"
 >
 <div className="flex flex-row gap-4">
 {/* Cover - Left Side */}
 <div className="relative w-28 h-40 flex-shrink-0">
 {/* Inner image container — overflow-hidden clips the hover rotation */}
 <div className="w-full h-full rounded-lg overflow-hidden shadow-sm bg-white">
 {book.cover ? (
 <img
 src={book.cover}
 alt={book.title}
 className="w-full h-full object-cover"
 />
 ) : (
 <BookCover
 title={book.title}
 author={book.author}
 className="w-full h-full"
 />
 )}

 {/* Status Badge */}
 <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status] || 'bg-gray-100'}`}>
 {book.status}
 </span>
 </div>

 {/* Sync status indicator — outside the clipping wrapper so it's never hidden */}
 {(book.sync_status === 'pending' || book.sync_status === 'failed') && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSyncPopover(prev => prev ? null : book.sync_status);
 }}
 className={`absolute -top-1 -left-1 z-20 w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1C1C20] transition-transform hover:scale-125
 ${book.sync_status === 'pending' ? 'bg-amber-400 text-white' : 'bg-red-500 text-white'}`}
 title={book.sync_status === 'pending' ? 'Syncing soon' : 'Sync failed'}
 >
 <Info size={11} weight="bold" />
 </button>
 )}
 </div>

 {/* Sync popover — portaled to body so it's above all cards */}
 {syncPopover && createPortal(
 <div className={resolvedTheme}>
 <div
 className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-150"
 onClick={(e) => { e.stopPropagation(); setSyncPopover(null); }}
 >
 <div
 className="w-full max-w-[280px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
 style={{ backgroundColor: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border-default))' }}
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header accent bar */}
 <div className={`h-1 w-full ${syncPopover === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`} />

 <div className="p-5">
 {/* Icon + Title */}
 <div className="flex items-center gap-2.5 mb-3">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${syncPopover === 'pending' ? 'bg-amber-400/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
 <Info size={16} weight="bold" />
 </div>
 <h4 className="text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
 {syncPopover === 'pending' ? 'Syncing soon' : 'Sync failed'}
 </h4>
 </div>

 {/* Body */}
 <p className="text-[12px] leading-relaxed" style={{ color: 'rgb(var(--text-tertiary))' }}>
 {syncPopover === 'pending'
 ? 'This book will sync automatically when your connection is stable. Your highlights and progress are safe locally.'
 : 'Unable to sync after several attempts. Try again on a stable connection, or delete and re-upload the book.'}
 </p>
 </div>

 {/* Dismiss button */}
 <div className="px-5 pb-4">
 <button
 onClick={(e) => { e.stopPropagation(); setSyncPopover(null); }}
 className="w-full py-2.5 text-xs font-semibold rounded-xl transition-colors"
 style={{ color: 'rgb(var(--text-tertiary))', backgroundColor: 'rgb(var(--bg-subtle))' }}
 >
 Got it
 </button>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* Info - Right Side */}
 <div className="flex-1 flex flex-col justify-between min-w-0">
 <div className="flex flex-col">
 <h3 className="font-semibold text-base sm:text-lg md:text-xl font-display text-text-primary truncate mb-1 group-hover:text-accent-primary transition-colors">
 {book.title}
 </h3>
 <p className="text-sm text-text-tertiary mb-3 text-left">by {book.author || "N/A"}</p>

 {/* Progress Bar */}
 <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1">
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

        <div className="flex justify-end gap-3 pt-2 mt-auto text-gray-400 items-center">
          <button
            onClick={handleFavoriteClick}
            className={`transition-colors ${book.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart size={20} weight={book.isFavorite ? 'fill' : 'regular'} />
          </button>
          <button
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            onClick={handleDetailsClick}
          >
            <Eye size={20} weight="bold" />
          </button>
          
          {/* 3-Dot Menu Container */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="text-gray-400 hover:text-text-primary transition-colors focus:outline-none"
            >
              <DotsThreeVertical size={20} weight="bold" />
            </button>

            {/* Menu Popup */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                />
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden flex flex-col py-1">
                  <button
                    onClick={(e) => { setShowMenu(false); handleBookmarkClick(e); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors w-full text-left"
                  >
                    <FolderSimplePlus size={18} weight={isInAnySpace ? 'fill' : 'regular'} className={isInAnySpace ? 'text-accent-primary' : ''} />
                    {isInAnySpace ? 'Update Space' : 'Add to Bookspace'}
                  </button>
                  <button
                    onClick={handleShareClick}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors w-full text-left"
                  >
                    <ShareNetwork size={18} />
                    Share Book
                  </button>
                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1 w-full" />
                  <button
                    onClick={(e) => { setShowMenu(false); handleDeleteClick(e); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
                  >
                    <Trash size={18} weight="bold" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
 </div>
 </div>
 </Card>

 {/* Delete confirmation modal */}
 <Modal
 isOpen={showDeleteModal}

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
 <Modal
   isOpen={showSpaceModal}
   title="Save to Space"
   onClose={() => setShowSpaceModal(false)}
   actions={[
     {
       label: (
         <div className="flex items-center justify-center gap-2">
           {isInAnySpace ? <PencilSimple size={18} weight="fill" /> : <FolderSimplePlus size={18} weight="fill" />}
           <span>{isInAnySpace ? "Update Space" : "Add to Bookspace"}</span>
         </div>
       ),
       variant: 'primary',
       onClick: handleConfirmAddToSpace
     }
   ]}
 >
   <div className="flex flex-col gap-1">
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
           <FolderSimplePlus size={20} weight="bold" className="text-neutral-400" />
         </div>
         <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No custom spaces yet</p>
         <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Create spaces to organize your library.</p>
       </div>
     )}
   </div>
 </Modal>

  {/* Share Modal */}
  <ShareModal
    isOpen={showShareModal}
    onClose={() => setShowShareModal(false)}
    shareTitle="Check out this book on Apex"
    shareText={`I'm reading "${book.title}" by ${book.author || "Unknown Author"} on Apex!`}
    shareUrl={`${window.location.origin}/share?type=book&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || "")}`}
  />
 </>
 );
}
