import React, { useContext } from 'react';
import EmptyState from '../../ui/EmptyState';
import ListItem from '../../ui/ListItem';
import Label from '../../ui/Label';
import { TextAa, Trash } from '@phosphor-icons/react';
import { BookContext } from '../../../context/BookContextInstance';

function DocumentsWords({ book }) {
    const { removeSavedWord } = useContext(BookContext) || {};
    const words = book?.metadata?.words || [];

    if (!words || words.length === 0) {
        return (
            <EmptyState 
                icon={TextAa}
                title="No saved words"
                description="Words you save in the dictionary while reading will appear here."
            />
        );
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
        <div className='flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {words.map((wordItem, index) => (
                <ListItem
                    key={index}
                    icon={TextAa}
                    label={wordItem.word}
                    right={
                        <div className="flex items-center gap-2">
                            {wordItem.partOfSpeech && (
                                <Label
                                    variant="neutral"
                                    content={wordItem.partOfSpeech}
                                    className="!text-[10px] sm:!text-xs !px-2.5 sm:!px-3.5 !py-0.5 sm:!py-1"
                                />
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(wordItem.word);
                                }}
                                className="p-1.5 text-text-placeholder hover:text-error hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove word"
                            >
                                <Trash size={16} weight="bold" />
                            </button>
                        </div>
                    }
                    subComponent={
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            <p className='text-xs text-text-tertiary line-clamp-2'>
                                {wordItem.definition}
                            </p>
                            {wordItem.addedAt && (
                                <span className="text-[11px] text-text-placeholder">
                                    Saved {formatDate(wordItem.addedAt)}
                                </span>
                            )}
                        </div>
                    }
                />
            ))}
        </div>
    );
}

export default DocumentsWords;
