import authService from './authService';

/**
 * AI Service — Fetch wrappers for Apex AI backend endpoints.
 * All streaming endpoints return a ReadableStream reader for SSE consumption.
 */
const API_BASE = '/api/ai';  // relative — proxied by Vite (dev) and Vercel (prod)
const FETCH_TIMEOUT_MS = 30000; // 30s — fail fast when backend is unreachable

/**
 * Combine an optional user-abort signal with a timeout signal so fetch
 * never hangs forever when the backend is down.
 */
function buildSignal(userSignal) {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  if (!userSignal) return timeoutSignal;
  // AbortSignal.any is supported in all modern browsers (Chrome 116+, Safari 17.4+)
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([userSignal, timeoutSignal]);
  }
  // Fallback for older browsers — prefer the user signal but add a manual timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('The operation timed out.', 'TimeoutError')), FETCH_TIMEOUT_MS);
  userSignal.addEventListener('abort', () => { clearTimeout(timer); controller.abort(userSignal.reason); }, { once: true });
  return controller.signal;
}

/**
 * Helper to get default headers with auth token.
 */
const getHeaders = (contentType = 'application/json') => {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = authService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Stream an explanation of highlighted text.
 * Returns a Response object whose body is an SSE stream.
 */
export async function streamExplain({ selectedText, context, bookTitle, bookId, chatType, conversationHistory = [] }, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: getHeaders(),
      signal: buildSignal(signal),
      body: JSON.stringify({
        selected_text: selectedText,
        context: context || null,
        book_title: bookTitle || null,
        book_id: bookId || null,
        chat_type: chatType || 'in_reader',
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : msg.role,
          content: msg.content,
        })),
      }),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error('Server is not responding. Please check your connection and try again.');
    }
    throw err;
  }

  if (!response.ok) {
    const errorMsg = `Explain request failed: ${response.status}`;
    if (import.meta.env.DEV) console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response;
}

/**
 * Stream an AI response to an open-ended question.
 * Returns a Response object whose body is an SSE stream.
 */
export async function streamAsk({ message, bookTitle, bookId, chatType, conversationHistory = [] }, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: getHeaders(),
      signal: buildSignal(signal),
      body: JSON.stringify({
        message,
        book_title: bookTitle || null,
        book_id: bookId || null,
        chat_type: chatType || 'general',
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : msg.role,
          content: msg.content,
        })),
      }),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error('Server is not responding. Please check your connection and try again.');
    }
    throw err;
  }

  if (!response.ok) {
    const errorMsg = `Ask request failed: ${response.status}`;
    if (import.meta.env.DEV) console.error(errorMsg);
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
    headers: getHeaders(),
    body: JSON.stringify({
      highlights,
      book_title: bookTitle || null,
    }),
  });

  if (!response.ok) {
    const errorMsg = `Summarize request failed: ${response.status}`;
    if (import.meta.env.DEV) console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response.json();
}
