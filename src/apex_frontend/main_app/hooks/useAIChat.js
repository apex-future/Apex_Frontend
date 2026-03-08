import { useState, useCallback, useEffect } from 'react';
import { streamExplain, streamAsk } from '../services/aiService';
import { saveChat, getAllChats, deleteChat as dbDeleteChat } from '../utils/db';

/**
 * useAIChat — Custom hook for streaming AI chat interactions with persistence.
 */
export default function useAIChat(options = {}) {
  const { autoLoad = true, persist = true, scope = 'general', bookId = null } = options;
  
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  
  const createNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(Date.now());
    setError(null);
    setIsStreaming(false);
  }, []);

  // Load history on mount
  const loadHistory = useCallback(async () => {
    try {
      const history = await getAllChats();
      // Filter by scope
      const scopedHistory = history.filter(chat => chat.scope === scope || (!chat.scope && scope === 'general'));
      // Sort by last updated (id is timestamp)
      const sortedHistory = scopedHistory.sort((a, b) => b.updatedAt - a.updatedAt);
      setChatHistory(sortedHistory);
      return sortedHistory;
    } catch (err) {
      console.error("Failed to load chat history:", err);
      return [];
    }
  }, [scope]);

  useEffect(() => {
    if (!autoLoad) return;
    
    Promise.resolve().then(() => loadHistory()).then(history => {
      if (history.length > 0 && !sessionId) {
        // Load the most recent session
        const mostRecent = history[0];
        setSessionId(mostRecent.id);
        setMessages(mostRecent.messages || []);
      } else if (history.length === 0 && !sessionId) {
        // Start a fresh session if none exists
        createNewChat();
      }
    });
  }, [loadHistory, sessionId, autoLoad, createNewChat]);

  /**
   * Helper to persist current state to DB
   */
  const persistChat = useCallback(async (currentSessionId, currentMessages) => {
    if (!currentSessionId || !persist) return;

    // Determine a title based on the first user message
    const firstUserMsg = currentMessages.find(m => m.role === 'user');
    const title = firstUserMsg 
      ? (firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : ''))
      : 'New Chat';

    const chatDoc = {
      id: currentSessionId,
      title,
      messages: currentMessages,
      updatedAt: Date.now(),
      scope: scope // Store the scope
    };

    try {
      await saveChat(chatDoc);
      loadHistory(); // Refresh sidebar history
    } catch (err) {
      console.error("Failed to persist chat:", err);
    }
  }, [loadHistory, persist, scope]);

  /**
   * Parse an SSE stream and update the current AI message in real-time.
   */
  const consumeStream = useCallback(async (response, activeSessionId) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      let finalMessages = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.error) {
              setError(data.error);
              setIsStreaming(false);
              return;
            }

            if (data.chunk) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'ai') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.chunk,
                  };
                }
                finalMessages = updated;
                return updated;
              });
            }

            if (data.done) {
              setIsStreaming(false);
              persistChat(activeSessionId, finalMessages);
              return;
            }
          } catch (e) {
            console.error("Failed to parse SSE line:", e);
          }
        }
      }
      setIsStreaming(false);
      persistChat(activeSessionId, finalMessages);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Connection lost. Please try again.');
      }
      setIsStreaming(false);
    }
  }, [persistChat]);

  const sendMessage = useCallback(async (text, bookTitle, displayContent) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    const activeSessionId = sessionId || Date.now();
    if (!sessionId) setSessionId(activeSessionId);

    const userMsg = { id: Date.now(), role: 'user', content: (displayContent || text).trim() };
    const aiPlaceholder = { id: Date.now() + 1, role: 'ai', content: '' };

    const newMessages = [...messages, userMsg, aiPlaceholder];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await streamAsk({
        message: text.trim(),
        bookTitle,
        bookId,
        chatType: scope === 'general' ? 'general' : 'in_reader',
        conversationHistory: history,
      });

      await consumeStream(response, activeSessionId);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsStreaming(false);
    }
  }, [isStreaming, messages, consumeStream, sessionId]);

  const sendExplain = useCallback(async (selectedText, context, bookTitle, displayContent) => {
    if (!selectedText.trim() || isStreaming) return;
    setError(null);

    const activeSessionId = sessionId || Date.now();
    if (!sessionId) setSessionId(activeSessionId);

    const aiPlaceholder = { id: Date.now(), role: 'ai', content: '' };
    const userMsg = displayContent ? { id: Date.now() - 1, role: 'user', content: displayContent.trim() } : null;
    
    const newMessages = userMsg ? [...messages, userMsg, aiPlaceholder] : [...messages, aiPlaceholder];
    
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await streamExplain({
        selectedText: selectedText.trim(),
        context,
        bookTitle,
        bookId,
        chatType: 'in_reader',
        conversationHistory: history,
      });

      await consumeStream(response, activeSessionId);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsStreaming(false);
    }
  }, [isStreaming, messages, consumeStream, sessionId]);

  const switchChat = useCallback((session) => {
    if (isStreaming) return;
    setSessionId(session.id);
    setMessages(session.messages || []);
    setError(null);
  }, [isStreaming]);

  const deleteSession = useCallback(async (id) => {
    try {
      await dbDeleteChat(id);
      if (sessionId === id) {
        createNewChat();
      }
      loadHistory();
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }, [sessionId, createNewChat, loadHistory]);

  return {
    messages,
    isStreaming,
    error,
    sessionId,
    chatHistory,
    sendMessage,
    sendExplain,
    createNewChat,
    switchChat,
    deleteSession,
    retry: () => {
      setError(null);
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        setMessages(prev => prev.filter(m => m.id !== lastUserMsg.id && !(m.role === 'ai' && m.content === '')));
        sendMessage(lastUserMsg.content);
      }
    },
  };
}


