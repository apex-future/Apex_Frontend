import { useState, useRef, useCallback } from 'react';
import { streamExplain, streamAsk } from '../services/aiService';

/**
 * useAIChat — Custom hook for streaming AI chat interactions.
 *
 * Manages message history, SSE streaming, and loading/error states.
 * Works with both /explain (highlight-based) and /ask (open-ended) endpoints.
 */
export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Parse an SSE stream and update the current AI message in real-time.
   */
  const consumeStream = useCallback(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.error) {
              console.error("AI Stream Error:", data.error);
              setError(data.error);
              setIsStreaming(false);
              return;
            }

            if (data.chunk) {
              // Append chunk to the last (AI) message
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'ai') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.chunk,
                  };
                }
                return updated;
              });
            }

            if (data.done) {
              setIsStreaming(false);
              return;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Stream ended without a done signal — finalize anyway
      setIsStreaming(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Stream reader error:", err);
        setError('Connection lost. Please try again.');
      }
      setIsStreaming(false);
    }
  }, []);

  /**
   * Send an open-ended question via /ask.
   */
  const sendMessage = useCallback(async (text, bookTitle) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    const userMsg = { id: Date.now(), role: 'user', content: text.trim() };
    const aiPlaceholder = { id: Date.now() + 1, role: 'ai', content: '' };

    setMessages(prev => [...prev, userMsg, aiPlaceholder]);
    setIsStreaming(true);

    try {
      // Build conversation history (exclude the placeholder and current msg)
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await streamAsk({
        message: text.trim(),
        bookTitle,
        conversationHistory: history,
      });

      await consumeStream(response);
    } catch (err) {
      console.error("sendMessage error:", err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsStreaming(false);
    }
  }, [isStreaming, messages, consumeStream]);

  /**
   * Send an explain request via /explain (triggered by text highlight).
   */
  const sendExplain = useCallback(async (selectedText, context, bookTitle) => {
    if (!selectedText.trim() || isStreaming) return;
    setError(null);

    const aiPlaceholder = { id: Date.now(), role: 'ai', content: '' };

    setMessages(prev => [...prev, aiPlaceholder]);
    setIsStreaming(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await streamExplain({
        selectedText: selectedText.trim(),
        context,
        bookTitle,
        conversationHistory: history,
      });

      await consumeStream(response);
    } catch (err) {
      console.error("sendExplain error:", err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsStreaming(false);
    }
  }, [isStreaming, messages, consumeStream]);

  /**
   * Clear conversation and start fresh.
   */
  const clearConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  /**
   * Retry the last failed message.
   */
  const retry = useCallback(() => {
    setError(null);
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove the failed AI placeholder and the user message
      setMessages(prev => prev.filter(m => m.id !== lastUserMsg.id && !(m.role === 'ai' && m.content === '')));
      // Resend
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    sendExplain,
    clearConversation,
    retry,
  };
}
