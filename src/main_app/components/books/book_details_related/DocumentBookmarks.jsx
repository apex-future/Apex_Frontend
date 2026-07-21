import React from 'react';
import EmptyState from '../../ui/EmptyState';
import ListItem from '../../ui/ListItem';
import Label from '../../ui/Label';
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

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <EmptyState 
                icon={BookmarkSimple}
                title="No snapshots saved yet"
                description="Tap the bookmark icon while reading to save specific pages here."
            />
        );
    }

    return (
        <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <div className="flex items-center gap-2 px-1">
                <BookmarkSimple size={14} weight="bold" className="text-accent-primary dark:text-accent-primary-dark" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary dark:text-text-tertiary-dark">
                    Page Bookmarks ({bookmarks.length})
                </h4>
            </div>

            <div className='flex flex-col gap-2.5'>
                {bookmarks.map((bookmark, index) => (
                    <ListItem
                        key={index}
                        icon={BookmarkSimple}
                        label={bookmark.label || `Page ${bookmark.page}`}
                        right={
                            <Label
                                variant="accent"
                                content={`Page ${bookmark.page}`}
                                className="!text-[10px] sm:!text-xs !px-2.5 sm:!px-3.5 !py-0.5 sm:!py-1"
                            />
                        }
                        subComponent={
                            bookmark.addedAt ? (
                                <span className="text-xs text-text-tertiary">
                                    Saved {formatDate(bookmark.addedAt)}
                                </span>
                            ) : null
                        }
                    />
                ))}
            </div>
        </div>
    );
}

export default DocumentBookmarks;
