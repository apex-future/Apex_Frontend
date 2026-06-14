import React, { useState, useEffect } from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';
import { getAllChats } from '../../../utils/db';
import { MessageSquare, Loader2 } from 'lucide-react';
import { cleanUserMessage, stripMarkdown, getChatTitle } from '../../../utils/aiUtils';

function DocumentChatHistory({ book }) {
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChats = async () => {
            try {
                setLoading(true);
                const allChats = await getAllChats();
                // Filter chats scoped to this book's title (matching AIModal's scope logic)
                const bookTitle = book?.title || '';
                const bookChats = allChats.filter(
                    (chat) => chat.scope === bookTitle
                );
                // Sort by most recently updated
                bookChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                setChatHistory(bookChats);
            } catch (err) {
                console.error('Failed to load chat history:', err);
            } finally {
                setLoading(false);
            }
        };
        loadChats();
    }, [book?.title]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 size={24} className="animate-spin text-accent-primary opacity-50" />
            </div>
        );
    }

    if (!chatHistory || chatHistory.length === 0) {
        return <EmptyState itemName="chat history" />;
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLastMessage = (chat) => {
        if (!chat.messages || chat.messages.length === 0) return 'No messages';
        const lastMsg = chat.messages[chat.messages.length - 1];
        const content = lastMsg.content || '';
        const cleaned = lastMsg.role === 'user' ? cleanUserMessage(content) : stripMarkdown(content);
        return cleaned.length > 100 ? cleaned.slice(0, 100) + '...' : cleaned;
    };

    const getMessageCount = (chat) => {
        return chat.messages?.length || 0;
    };

    return (
        <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {chatHistory.map((chat) => (
                <div key={chat.id} className='flex items-start gap-4 p-4 bg-white dark:bg-bg-dark-elevated border border-border-default dark:border-border-default-dark rounded-xl hover:shadow-sm transition-all cursor-pointer group'>
                    <div className="p-2 bg-accent-subtle dark:bg-accent-subtle-dark rounded-lg text-accent-primary dark:text-accent-primary-dark group-hover:bg-accent-primary group-hover:text-white transition-colors flex-shrink-0">
                        <MessageSquare size={20} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <h2 className='text-text-primary dark:text-text-primary-dark font-semibold group-hover:text-accent-primary transition-colors truncate'>
                            {getChatTitle(chat)}
                        </h2>
                        <p className='text-text-tertiary dark:text-text-tertiary-dark text-sm line-clamp-2'>{getLastMessage(chat)}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-placeholder dark:text-text-placeholder-dark">
                                {formatDate(chat.updatedAt)}
                            </span>
                            <span className="text-xs text-text-placeholder dark:text-text-placeholder-dark">
                                {getMessageCount(chat)} messages
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DocumentChatHistory