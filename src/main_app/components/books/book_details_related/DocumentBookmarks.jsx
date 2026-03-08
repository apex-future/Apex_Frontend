import React from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { Bookmark } from 'lucide-react';

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
            {/* Book Level Status Card */}
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between ${isBookLevelMarked
                ? 'bg-accent-subtle/30 border-accent-primary/20 shadow-sm'
                : 'bg-neutral-50/50 border-border-default/50 border-dashed'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isBookLevelMarked ? 'bg-accent-primary text-white' : 'bg-neutral-200 text-text-placeholder'
                        }`}>
                        <Bookmark size={24} fill={isBookLevelMarked ? 'currentColor' : 'none'} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className={`font-bold text-sm uppercase tracking-wider ${isBookLevelMarked ? 'text-accent-primary' : 'text-text-tertiary'}`}>
                            {isBookLevelMarked ? 'Bookmarked' : 'Save Book'}
                        </h3>
                        <p className="text-xs text-text-tertiary">
                            {isBookLevelMarked ? 'This book is in your saved collection' : 'Mark this entire book to save it for later'}
                        </p>
                    </div>
                </div>
                {/* Visual indicator of bookmark status */}
                <div className={`w-2 h-2 rounded-full ${isBookLevelMarked ? 'bg-accent-primary animate-pulse' : 'bg-neutral-300'}`} />
            </div>

            {/* Page Bookmarks List */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <Bookmark size={14} className="text-accent-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Page Bookmarks ({bookmarks.length})</h4>
                </div>

                {bookmarks.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-border-default">
                        <p className="text-xs font-semibold text-text-tertiary tracking-tight uppercase">No snapshots saved yet</p>
                        <p className="text-[10px] text-text-placeholder mt-1">Tap the bookmark icon while reading to save specific pages here.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-3'>
                        {bookmarks.map((bookmark, index) => (
                            <div key={index} className='flex items-start gap-4 p-4 bg-white border border-border-default rounded-xl hover:shadow-md transition-all cursor-pointer group'>
                                <div className="p-2 bg-accent-subtle rounded-lg text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                    <Bookmark size={20} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h2 className='text-text-primary font-semibold group-hover:text-accent-primary transition-colors'>
                                        {bookmark.label || `Page ${bookmark.page}`}
                                    </h2>
                                    <p className='text-text-tertiary text-sm'>Page {bookmark.page}</p>
                                    {bookmark.addedAt && (
                                        <span className="text-xs text-text-placeholder mt-1">
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