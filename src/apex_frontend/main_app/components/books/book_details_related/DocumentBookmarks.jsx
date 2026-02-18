import React from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { Bookmark } from 'lucide-react';

function DocumentBookmarks() {
    // Mock data - set to empty array to test empty state
    const bookmarks = []; 
    
    if (!bookmarks || bookmarks.length === 0) {
        return <EmptyState itemName="bookmarks" />;
    }

    return (
        <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
             {bookmarks.map((bookmark, index) => (
                <div key={index} className='flex items-start gap-4 p-4 bg-white border border-border-default rounded-xl hover:shadow-md transition-all cursor-pointer group'>
                    <div className="p-2 bg-accent-subtle rounded-lg text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                        <Bookmark size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className='text-text-primary font-semibold group-hover:text-accent-primary transition-colors'>Page {bookmark.page}</h2>
                        <p className='text-text-tertiary line-clamp-2'>{bookmark.preview}</p>
                        <span className="text-xs text-text-placeholder mt-1">{bookmark.date}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DocumentBookmarks