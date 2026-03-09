import React, { useContext } from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { BookA, Trash2 } from 'lucide-react';
import { BookContext } from '../../../context/BookContextInstance';

function DocumentsWords({ book }) {
    const { removeSavedWord } = useContext(BookContext);
    const words = book?.metadata?.words || [];

    if (!words || words.length === 0) {
        return <EmptyState itemName="saved words" />;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        });
    };

    const handleRemove = (word) => {
        if (!book?.id) return;
        removeSavedWord(book.id, word);
    };

    return (
        <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {words.map((wordItem, index) => (
                <div key={index} className='flex items-center gap-4 p-4 bg-white border border-border-default rounded-xl hover:shadow-md transition-all group'>
                     <div className="p-2 bg-accent-subtle rounded-lg text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors flex-shrink-0">
                        <BookA size={20} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className='text-text-primary font-semibold group-hover:text-accent-primary transition-colors capitalize'>
                                {wordItem.word}
                            </h2>
                            {wordItem.partOfSpeech && (
                                <span className="text-[10px] font-bold text-text-placeholder uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded-full">
                                    {wordItem.partOfSpeech}
                                </span>
                            )}
                        </div>
                        <p className='text-text-tertiary text-sm line-clamp-2'>{wordItem.definition}</p>
                        {wordItem.addedAt && (
                            <span className="text-xs text-text-placeholder mt-0.5">
                                Saved {formatDate(wordItem.addedAt)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => handleRemove(wordItem.word)}
                        className="p-2 text-text-placeholder hover:text-error hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remove word"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    )
}

export default DocumentsWords