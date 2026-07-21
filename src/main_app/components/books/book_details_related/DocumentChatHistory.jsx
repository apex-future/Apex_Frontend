import React, { useState, useEffect } from 'react';
import EmptyState from '../../ui/EmptyState';
import ListItem from '../../ui/ListItem';
import { getAllChats } from '../../../utils/db';
import { ChatCircle, Spinner } from '@phosphor-icons/react';
import { getChatTitle } from '../../../utils/aiUtils';

function DocumentChatHistory({ book }) {
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChats = async () => {
            try {
                setLoading(true);
                const allChats = await getAllChats();
                const bookTitle = book?.title || '';
                const bookChats = allChats.filter(
                    (chat) => chat.scope === bookTitle
                );
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
            <div className="flex items-center justify-center min-h-[200px]">
                <Spinner size={24} weight="bold" className="animate-spin text-accent-primary opacity-50" />
            </div>
        );
    }

    if (!chatHistory || chatHistory.length === 0) {
        return (
            <EmptyState 
                icon={ChatCircle}
                title="No chat history"
                description="Your conversations with the AI assistant for this book will appear here."
            />
        );
    }

    return (
        <div className='flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {chatHistory.map((chat) => (
                <ListItem
                    key={chat.id}
                    icon={ChatCircle}
                    label={getChatTitle(chat)}
                />
            ))}
        </div>
    );
}

export default DocumentChatHistory;
