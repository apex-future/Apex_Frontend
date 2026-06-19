import React, { useState, useMemo } from 'react';
import { FileText, Plus, Trash, PencilSimple, FloppyDisk, X, CalendarBlank, MagnifyingGlass, Note, Quotes } from '@phosphor-icons/react';

/**
 * SidebarTabsView
 * Enhanced tab-taking interface with search and context support.
 */
function SidebarTabsView({ tabs = [], addTab, updateTab, deleteTab }) {
    const [newTab, setNewTab] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTabs = useMemo(() => {
        if (!searchQuery.trim()) return tabs;
        const query = searchQuery.toLowerCase();
        return tabs.filter(tab =>
            tab.text.toLowerCase().includes(query) ||
            (tab.context && tab.context.toLowerCase().includes(query))
        );
    }, [tabs, searchQuery]);

    const handleAdd = () => {
        if (!newTab.trim()) return;
        addTab(newTab.trim());
        setNewTab('');
        setIsAdding(false);
    };

    const handleEdit = (tabId, text) => {
        setEditingId(tabId);
        setEditText(text);
    };

    const handleSaveEdit = (tabId) => {
        if (!editText.trim()) return;
        updateTab(tabId, editingId === tabId ? editText.trim() : tabs.find(n => n.id === tabId).text);
        setEditingId(null);
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className='flex flex-col h-full bg-bg-elevated font-sans'>
            {/* MagnifyingGlass Bar */}
            <div className='px-4 pt-4 pb-2'>
                <div className='relative group'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <MagnifyingGlass size={14} weight="bold" className='text-text-placeholder group-focus-within:text-accent-primary transition-colors' />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tabs..."
                        className='w-full pl-9 pr-4 py-2 bg-bg-subtle/50 border border-border-default/60 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10 focus:bg-bg-elevated transition-all'
                    />
                </div>
            </div>

            {/* Create Note Trigger/Form */}
            <div className='p-4 pt-2 border-b border-border-default/30'>
                {isAdding ? (
                    <div className='flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300'>
                        <textarea
                            autoFocus
                            value={newTab}
                            onChange={(e) => setNewTab(e.target.value)}
                            placeholder="What's on your mind?..."
                            className='w-full p-4 rounded-2xl bg-bg-elevated border border-accent-primary/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[120px] resize-none leading-relaxed shadow-inner'
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => setIsAdding(false)}
                                className='px-4 py-2 rounded-xl text-xs font-bold text-text-tertiary hover:bg-bg-subtle transition-all'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newTab.trim()}
                                className='px-5 py-2 rounded-xl text-xs font-bold bg-accent-primary text-white shadow-lg shadow-accent-primary/20 hover:bg-accent-hover disabled:opacity-50 transition-all flex items-center gap-2'
                            >
                                <Plus size={14} weight="bold" /> Save Tab
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className='w-full p-3 rounded-2xl border-2 border-dashed border-border-default text-text-tertiary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-subtle/20 transition-all flex items-center justify-center gap-2 group'
                    >
                        <Plus size={16} weight="bold" className='group-hover:scale-110 transition-transform' />
                        <span className='text-sm font-bold'>Jot down a tab</span>
                    </button>
                )}
            </div>

            {/* Notes list */}
            <div className='flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4'>
                {filteredTabs.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500'>
                        <div className='w-16 h-16 rounded-3xl bg-bg-subtle/50 flex items-center justify-center mb-4 text-text-placeholder border border-border-default/40'>
                            {searchQuery ? <MagnifyingGlass size={28} weight="bold" /> : <Note size={28} weight="bold" />}
                        </div>
                        <h4 className='text-sm font-bold text-text-secondary'>
                            {searchQuery ? 'No matches found' : 'Your notebook is empty'}
                        </h4>
                        <p className='text-[11px] text-text-tertiary mt-2 leading-relaxed uppercase tracking-wider max-w-[200px]'>
                            {searchQuery ? `We couldn't find any tab matching "${searchQuery}"` : 'Capture ideas, quotes or summaries from your reading.'}
                        </p>
                    </div>
                ) : (
                    filteredTabs.map(tab => (
                        <div
                            key={tab.id}
                            className='group flex flex-col gap-3 p-5 rounded-3xl bg-bg-elevated border border-border-default/50 hover:border-accent-primary/20 hover:shadow-xl hover:shadow-accent-primary/5 transition-all duration-500 relative overflow-hidden'
                        >
                            {tab.type === 'highlight_note' && !editingId && (
                                <div className='absolute top-0 right-0 w-12 h-12 bg-accent-primary/5 rounded-bl-[2.5rem] flex items-start justify-end p-2 text-accent-primary opacity-20 pointer-events-none'>
                                    <Quotes size={12} weight="fill" />
                                </div>
                            )}

                            {editingId === tab.id ? (
                                <div className='flex flex-col gap-3'>
                                    <textarea
                                        autoFocus
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className='w-full p-4 rounded-2xl bg-bg-subtle border border-accent-primary text-sm text-text-primary focus:outline-none min-h-[100px] resize-none shadow-inner'
                                    />
                                    <div className='flex justify-end gap-2'>
                                        <button onClick={() => setEditingId(null)} className='p-2 rounded-xl text-text-tertiary hover:bg-bg-subtle transition-all'><X size={16} weight="bold" /></button>
                                        <button onClick={() => handleSaveEdit(tab.id)} className='p-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-accent-primary/20'><FloppyDisk size={14} weight="bold" /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {tab.context && (
                                        <div className='bg-bg-subtle/50 p-3 rounded-2xl border-l-4 border-accent-primary/30'>
                                            <p className='text-[10px] text-accent-primary font-black uppercase tracking-widest mb-1.5 opacity-60'>Linked Context</p>
                                            <p className='text-[13px] text-text-secondary italic line-clamp-3 leading-relaxed'>"{tab.context}"</p>
                                        </div>
                                    )}

                                    <div className='flex justify-between items-start gap-4'>
                                        <p className='text-[15px] text-text-primary leading-relaxed font-medium flex-1'>
                                            {tab.text}
                                        </p>
                                        <div className='flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-2 scale-90'>
                                            <button onClick={() => handleEdit(tab.id, tab.text)} className='p-2 rounded-xl bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-accent-primary hover:border-accent-primary/20 transition-all'><PencilSimple size={14} weight="bold" /></button>
                                            <button onClick={() => deleteTab(tab.id)} className='p-2 rounded-xl bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-red-500 hover:border-red-100 transition-all'><Trash size={14} weight="bold" /></button>
                                        </div>
                                    </div>

                                    <div className='flex items-center justify-between pt-3 border-t border-border-default/30'>
                                        <div className='flex items-center gap-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider'>
                                            <CalendarBlank size={12} weight="bold" className='opacity-40' />
                                            {formatDate(tab.updatedAt || tab.createdAt)}
                                            {tab.updatedAt && tab.updatedAt !== tab.createdAt && <span className='lowercase opacity-50 font-medium'>(edited)</span>}
                                        </div>
                                        <span className='text-[9px] font-black text-text-placeholder uppercase tracking-tighter'>
                                            {tab.type === 'highlight_note' ? 'Highlight Tab' : 'Manual Tab'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default SidebarTabsView;
