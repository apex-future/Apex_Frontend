import React from 'react'
import EmptyState from '../../ui/EmptyState';
import { BookmarkSimple } from '@phosphor-icons/react';

function DocumentBookmarks({ book }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const bookmarks = book?.metadata?.bookmarks || [];

    const isBookLevelMarked = book?.isBookmarked;

    return (
        <div className='flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
           

            {/* Page Bookmarks List */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <BookmarkSimple size={14} weight="bold" className="text-accent-primary dark:text-accent-primary-dark" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary dark:text-text-tertiary-dark">Page Bookmarks ({bookmarks.length})</h4>
                </div>

                {bookmarks.length === 0 ? (
                    <EmptyState 
                        icon={BookmarkSimple}
                        title="No snapshots saved yet"
                        description="Tap the bookmark icon while reading to save specific pages here."
                    />
                ) : (
                    <div className='grid grid-cols-1 gap-3'>
                        {bookmarks.map((bookmark, index) => (
                            <div key={index} className='flex items-start gap-4 p-4 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-xl hover:shadow-md transition-all cursor-pointer group'>
                                <div className="p-2 bg-accent-subtle dark:bg-accent-subtle-dark rounded-lg text-accent-primary dark:text-accent-primary-dark group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                    <BookmarkSimple size={20} weight="fill" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h2 className='text-text-primary dark:text-text-primary-dark font-semibold group-hover:text-accent-primary transition-colors'>
                                        {bookmark.label || `Page ${bookmark.page}`}
                                    </h2>
                                    <p className='text-text-tertiary dark:text-text-tertiary-dark text-sm'>Page {bookmark.page}</p>
                                    {bookmark.addedAt && (
                                        <span className="text-xs text-text-placeholder dark:text-text-placeholder-dark mt-1">
                                            {formatDate(bookmark.addedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocumentBookmarks
