import React from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { BookA } from 'lucide-react';

function DocumentsWords() {
    // Mock data
    const words = [];

    if (!words || words.length === 0) {
        return <EmptyState itemName="saved words" />;
    }

    return (
        <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {words.map((wordItem, index) => (
                <div key={index} className='flex items-center gap-4 p-4 bg-white border border-border-default rounded-xl hover:shadow-md transition-all cursor-pointer group'>
                     <div className="p-2 bg-accent-subtle rounded-lg text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                        <BookA size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className='text-text-primary font-semibold group-hover:text-accent-primary transition-colors'>{wordItem.word}</h2>
                        <p className='text-text-tertiary text-sm'>{wordItem.definition}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DocumentsWords