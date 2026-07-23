import React, { useState, useEffect } from 'react';
import EmptyState from '../../ui/EmptyState';
import ListItem from '../../ui/ListItem';
import { ChatCircle, Spinner, PencilSimple } from '@phosphor-icons/react';
import { getSessions, getSessionMessages, renameSession } from '../../../services/aiService';
import useAiStore from '../../../store/useAiStore';
import db from '../../../db/apex.db';

function DocumentChatHistory({ book }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const { setCurrentSessionId, setCurrentSessionMessages } = useAiStore();

    const bookId = book?.supabaseId || book?.id;

    useEffect(() => {
        let isMounted = true;
        const loadHistorySessions = async () => {
            try {
                let cached = [];
                if (bookId) {
                    cached = await db.ai_chat_sessions.where('book_id').equals(bookId).reverse().sortBy('updated_at');
                } else {
                    cached = await db.ai_chat_sessions.orderBy('updated_at').reverse().toArray();
                }
                if (cached && cached.length > 0 && isMounted) {
                    setSessions(cached);
                    setLoading(false);
                }
            } catch (e) {}

            try {
                const data = await getSessions(bookId);
                if (isMounted) {
                    setSessions(data);
                }
            } catch (err) {
                console.error('Failed to load chat sessions:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadHistorySessions();
        return () => { isMounted = false; };
    }, [bookId]);

    const handleSelectSession = async (session) => {
        try {
            setCurrentSessionId(session.id);
            const rawMsgs = await getSessionMessages(session.id);
            const formatted = [];
            for (const r of rawMsgs) {
                formatted.push({
                    id: r.id,
                    role: 'user',
                    content: r.query_text,
                    query_text: r.query_text,
                    highlightContext: r.highlight_context,
                    highlight_context: r.highlight_context
                });
                formatted.push({
                    id: r.id + '-ai',
                    role: 'ai',
                    content: r.ai_response
                });
            }
            setCurrentSessionMessages(formatted);
        } catch (err) {
            console.error('Failed to load session messages:', err);
        }
    };

    const handleRenameSubmit = async (session) => {
        const value = editValue.trim();
        setEditingId(null);
        if (!value || value === session.chat_header) return;

        console.log('[History] Rename submitted for session:', session.id, value);
        const oldHeader = session.chat_header;
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, chat_header: value } : s));
        try { await db.ai_chat_sessions.update(session.id, { chat_header: value, updated_at: new Date().toISOString() }); } catch (_) {}

        try {
            await renameSession(session.id, value);
        } catch (err) {
            console.error('Rename session failed:', err);
            setSessions(prev => prev.map(s => s.id === session.id ? { ...s, chat_header: oldHeader } : s));
            try { await db.ai_chat_sessions.update(session.id, { chat_header: oldHeader }); } catch (_) {}
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Spinner size={24} weight="bold" className="animate-spin text-accent-primary opacity-50" />
            </div>
        );
    }

    if (!sessions || sessions.length === 0) {
        return (
            <EmptyState 
                icon={ChatCircle}
                title="No chat history"
                description="Your conversations with the AI assistant for this book will appear here."
            />
        );
    }

    return (
        <div className='flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {sessions.map((session) => {
                const isUnnamed = session.chat_header === 'No chat title, try renaming';
                const isEditing = editingId === session.id;

                const editButton = (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(session.id);
                            setEditValue(isUnnamed ? '' : session.chat_header);
                        }}
                        className="p-1.5 hover:bg-bg-subtle rounded-lg text-text-tertiary hover:text-accent-primary transition-colors"
                        title="Rename chat"
                    >
                        <PencilSimple size={16} weight="bold" />
                    </button>
                );

                const labelContent = isEditing ? (
                    <input
                        type="text"
                        maxLength={60}
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(session);
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleRenameSubmit(session)}
                        placeholder="Name this chat..."
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-bg-dark border border-accent-primary rounded-md outline-none text-text-primary w-full max-w-[260px]"
                    />
                ) : (
                    <span className={isUnnamed ? 'italic text-text-tertiary font-normal' : ''}>
                        {session.chat_header}
                    </span>
                );

                return (
                    <ListItem
                        key={session.id}
                        icon={ChatCircle}
                        label={labelContent}
                        right={!isEditing ? editButton : null}
                        onClick={() => !isEditing && handleSelectSession(session)}
                    />
                );
            })}
        </div>
    );
}

export default DocumentChatHistory;
