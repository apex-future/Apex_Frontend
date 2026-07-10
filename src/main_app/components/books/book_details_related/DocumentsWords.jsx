import React, { useContext } from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { TextAa, Trash } from '@phosphor-icons/react';
import { BookContext } from '../../../context/BookContextInstance';

function DocumentsWords({ book }) {
    const { removeSavedWord } = useContext(BookContext) || {};
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
                <div key={index} className='flex items-center gap-4 p-4 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-xl hover:shadow-md transition-all group'>
                    <div className="p-2 bg-accent-subtle dark:bg-accent-subtle-dark rounded-lg text-accent-primary dark:text-accent-primary-dark group-hover:bg-accent-primary group-hover:text-white transition-colors flex-shrink-0">
                        <TextAa size={20} weight="bold" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className='text-text-primary dark:text-text-primary-dark font-semibold group-hover:text-accent-primary transition-colors capitalize'>
                                {wordItem.word}
                            </h2>
                            {wordItem.partOfSpeech && (
                                <span className="text-[10px] font-bold text-text-placeholder dark:text-text-placeholder-dark uppercase tracking-wider bg-neutral-100 dark:bg-bg-dark px-2 py-0.5 rounded-full">
                                    {wordItem.partOfSpeech}
                                </span>
                            )}
                        </div>
                        <p className='text-text-tertiary dark:text-text-tertiary-dark text-sm line-clamp-2'>{wordItem.definition}</p>
                        {wordItem.addedAt && (
                            <span className="text-xs text-text-placeholder dark:text-text-placeholder-dark mt-0.5">
                                Saved {formatDate(wordItem.addedAt)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => handleRemove(wordItem.word)}
                        className="p-2 text-text-placeholder dark:text-text-placeholder-dark hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remove word"
                    >
                        <Trash size={16} weight="bold" />
                    </button>
                </div>
            ))}
        </div>
    )
}

export default DocumentsWords
