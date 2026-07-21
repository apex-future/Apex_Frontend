import React, { useState, useMemo } from 'react';
import EmptyState from '../../ui/EmptyState';
import ListItem from '../../ui/ListItem';
import Label from '../../ui/Label';
import { MagnifyingGlass, Note, BookmarkSimple } from '@phosphor-icons/react';

function DocumentNotes({ book }) {
    const [searchQuery, setSearchQuery] = useState('');

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Combine notes and tabs for this book
    const combinedItems = useMemo(() => {
        const rawNotes = (book?.metadata?.notes || []).map((n, idx) => ({
            id: n.id || `note-${idx}`,
            category: 'Note',
            displayText: n.text || n.label || 'Untitled Note',
            context: n.context || null,
            page: n.page || n.pageNumber,
            date: n.updatedAt || n.createdAt,
            rawType: n.type || 'manual_note',
        }));

        const rawTabs = (book?.metadata?.tabs || []).map((t, idx) => ({
            id: t.id || `tab-${idx}`,
            category: 'Tab',
            displayText: t.text || t.label || (t.context ? `Fragment: "${t.context.slice(0, 40)}..."` : 'Saved Tab'),
            context: t.context || null,
            page: t.page || t.pageNumber,
            date: t.updatedAt || t.createdAt,
            rawType: t.type || t.noteType || 'tab',
        }));

        const merged = [...rawNotes, ...rawTabs];
        merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        return merged;
    }, [book?.metadata?.notes, book?.metadata?.tabs]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return combinedItems;
        const query = searchQuery.toLowerCase();
        return combinedItems.filter(item =>
            (item.displayText && item.displayText.toLowerCase().includes(query)) ||
            (item.context && item.context.toLowerCase().includes(query))
        );
    }, [combinedItems, searchQuery]);

    return (
        <div className='flex flex-col gap-6 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {/* Search Bar Header */}
            <div className='relative w-full group'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <MagnifyingGlass
                        size={18}
                        weight="bold"
                        className='text-text-placeholder dark:text-text-placeholder-dark group-focus-within:text-accent-primary transition-colors'
                    />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search through your notes and tabs..."
                    className='w-full pl-11 pr-4 py-3 bg-bg-subtle/50 dark:bg-bg-dark-elevated/50 border border-black/10 dark:border-white/10 rounded-2xl text-sm text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all'
                />
            </div>

            {/* List of Notes & Tabs or Empty State */}
            {filteredItems.length === 0 ? (
                <EmptyState
                    icon={searchQuery ? MagnifyingGlass : Note}
                    title={searchQuery ? "No matching notes or tabs" : "No notes or tabs saved"}
                    description={
                        searchQuery
                            ? `We couldn't find any note or tab matching "${searchQuery}".`
                            : "Notes and tabs created while reading this book will appear here."
                    }
                />
            ) : (
                <div className='flex flex-col gap-2.5'>
                    {filteredItems.map((item) => {
                        const isTab = item.category === 'Tab';
                        return (
                            <ListItem
                                key={item.id}
                                icon={isTab ? BookmarkSimple : Note}
                                label={item.displayText}
                                right={
                                    <div className="flex items-center gap-2">
                                        <Label
                                            variant={isTab ? "accent" : "info"}
                                            content={item.category}
                                            className="!text-[10px] sm:!text-xs !px-2.5 sm:!px-3.5 !py-0.5 sm:!py-1"
                                        />
                                        {item.page && (
                                            <span className="text-[10px] sm:text-xs font-semibold text-text-tertiary">
                                                Page {item.page}
                                            </span>
                                        )}
                                    </div>
                                }
                                subComponent={
                                    <div className="flex flex-col gap-1 mt-0.5">
                                        {item.context && (
                                            <p className="text-xs text-text-tertiary italic border-l-2 border-accent-primary/40 pl-2.5 py-0.5 line-clamp-2">
                                                "{item.context}"
                                            </p>
                                        )}
                                        {item.date && (
                                            <span className="text-[11px] text-text-placeholder">
                                                {formatDate(item.date)}
                                            </span>
                                        )}
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default DocumentNotes;
