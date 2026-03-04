import React from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { Bookmark } from 'lucide-react';

function DocumentBookmarks({ book }) {
    const bookmarks = book?.metadata?.bookmarks || [];

    if (!bookmarks || bookmarks.length === 0) {
        return <EmptyState itemName="bookmarks" />;
    }

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

    return (
        <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
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
    )
}

export default DocumentBookmarks