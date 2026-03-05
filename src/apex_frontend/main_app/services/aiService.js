/**
 * AI Service — Fetch wrappers for Apex AI backend endpoints.
 * All streaming endpoints return a ReadableStream reader for SSE consumption.
 */
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API_BASE = `${apiUrl}/api/ai`;

/**
 * Stream an explanation of highlighted text.
 * Returns a Response object whose body is an SSE stream.
 */
export async function streamExplain({ selectedText, context, bookTitle, conversationHistory = [] }) {
  const response = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selected_text: selectedText,
      context: context || null,
      book_title: bookTitle || null,
      conversation_history: conversationHistory.map(msg => ({
        role: msg.role === 'ai' ? 'model' : msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorMsg = `Explain request failed: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response;
}

/**
 * Stream an AI response to an open-ended question.
 * Returns a Response object whose body is an SSE stream.
 */
export async function streamAsk({ message, bookTitle, conversationHistory = [] }) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      book_title: bookTitle || null,
      conversation_history: conversationHistory.map(msg => ({
        role: msg.role === 'ai' ? 'model' : msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorMsg = `Ask request failed: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response;
}

/**
 * Summarize highlights into structured study notes (non-streaming).
 */
export async function summarizeHighlights({ highlights, bookTitle }) {
  const response = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      highlights,
      book_title: bookTitle || null,
    }),
  });

  if (!response.ok) {
    const errorMsg = `Summarize request failed: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response.json();
}
