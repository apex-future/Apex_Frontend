import authService from './authService';
import useXpStore from '../store/useXpStore';
import { XP_VALUES } from '../../config/xpConfig';
import db from '../db/apex.db';

/**
 * AI Service — Fetch wrappers for Cleo backend endpoints.
 * All streaming endpoints return a ReadableStream reader for SSE consumption.
 */
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api/ai`;
const FETCH_TIMEOUT_MS = 30000; // 30s — fail fast when backend is unreachable for TTFB

/**
 * Combine an optional user-abort signal with a TTFB (Time to First Byte) timeout.
 * Returns { signal, clearTimeout } so the timeout can be cleared once streaming begins.
 */
function buildSignalWithTTFB(userSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('Desktop is not responding. Please check your connection and try again.', 'TimeoutError'));
  }, FETCH_TIMEOUT_MS);

  if (userSignal) {
    userSignal.addEventListener('abort', () => { 
      clearTimeout(timer); 
      controller.abort(userSignal.reason); 
    }, { once: true });
  }
  
  return {
    signal: controller.signal,
    clearTimeout: () => clearTimeout(timer)
  };
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
export async function streamExplain({ selectedText, context, bookTitle, bookId, chatType, conversationHistory = [], sessionId = null }, signal) {
  let response;
  const { signal: fetchSignal, clearTimeout: clearFetchTimeout } = buildSignalWithTTFB(signal);

  try {
    response = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: getHeaders(),
      signal: fetchSignal,
      body: JSON.stringify({
        selected_text: selectedText,
        context: context || null,
        book_title: bookTitle || null,
        book_id: bookId || null,
        chat_type: chatType || 'in_reader',
        session_id: sessionId || null,
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : msg.role,
          content: msg.content,
        })),
      }),
    });
    // Connection established (headers received), clear the timeout so streaming can take as long as it needs
    clearFetchTimeout();
  } catch (err) {
    clearFetchTimeout();
    if (err.name === 'TimeoutError') {
      throw new Error('Desktop is not responding. Please check your connection and try again.');
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
export async function streamAsk({ message, bookTitle, bookId, chatType, conversationHistory = [], pageImageBase64 = null, sessionId = null }, signal) {
  if (import.meta.env.DEV) console.log('[Apex Cleo Debug] streamAsk — pageImageBase64 length:', pageImageBase64?.length);
  let response;
  const { signal: fetchSignal, clearTimeout: clearFetchTimeout } = buildSignalWithTTFB(signal);

  try {
    response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: getHeaders(),
      signal: fetchSignal,
      body: JSON.stringify({
        message,
        book_title: bookTitle || null,
        book_id: bookId || null,
        chat_type: chatType || 'general',
        session_id: sessionId || null,
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : msg.role,
          content: msg.content,
        })),
        page_image_base64: pageImageBase64 || null,
      }),
    });
    // Connection established (headers received), clear the timeout so streaming can take as long as it needs
    clearFetchTimeout();
  } catch (err) {
    clearFetchTimeout();
    if (err.name === 'TimeoutError') {
      throw new Error('Desktop is not responding. Please check your connection and try again.');
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

/**
 * Generate quiz questions from book page content (non-streaming).
 * Gemini reads page text and returns questions_payload array.
 */
export async function generateQuiz({ bookId, bookTitle, pageTexts, selectedPages, numQuestions, quizTime, questionType, difficulty }) {
  const response = await fetch(`${API_BASE}/generate-quiz`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      book_id: bookId,
      book_title: bookTitle || null,
      page_texts: pageTexts,       // array of { page: number, text: string }
      selected_pages: selectedPages,
      num_questions: numQuestions,
      quiz_time: quizTime,
      question_type: questionType, // 'multiple_choice' | 'short_essay'
      difficulty,
    }),
  });
  if (!response.ok) throw new Error(`Generate quiz failed: ${response.status}`);
  return response.json();
}

/**
 * Grade essay answers (non-streaming).
 * Groq receives questions + model answers + user answers, returns per-question scores.
 */
export async function gradeEssay({ bookId, questions }) {
  // questions: array of { id, question, model_answer, user_answer }
  const response = await fetch(`${API_BASE}/grade-essay`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      book_id: bookId,
      questions,
    }),
  });
  if (!response.ok) throw new Error(`Grade essay failed: ${response.status}`);
  return response.json();
}

/**
 * Fetch all AI chat sessions for current user (optional bookId filter).
 * Returns remote sessions and caches them in Dexie. Falls back to Dexie cache if network fails.
 */
export async function getSessions(bookId = null) {
  let cached = [];
  try {
    if (bookId) {
      cached = await db.ai_chat_sessions.where('book_id').equals(bookId).reverse().sortBy('updated_at');
    } else {
      cached = await db.ai_chat_sessions.orderBy('updated_at').reverse().toArray();
    }
  } catch (err) {
    console.warn('[aiService] Dexie cache read error:', err);
  }

  const url = bookId ? `${API_BASE}/sessions?book_id=${encodeURIComponent(bookId)}` : `${API_BASE}/sessions`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (response.ok) {
      const data = await response.json();
      try {
        if (data && data.length > 0) {
          await db.ai_chat_sessions.bulkPut(data);
        }
      } catch (cacheErr) {
        console.warn('[aiService] Dexie bulkPut error:', cacheErr);
      }
      return data;
    }
  } catch (netErr) {
    console.warn('[aiService] Failed to fetch remote sessions, returning Dexie cache:', netErr);
  }

  return cached;
}

/**
 * Fetch all messages for a specific chat session ordered by sequence_order ASC.
 */
export async function getSessionMessages(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`Fetch session messages failed: ${response.status}`);
  return response.json();
}

/**
 * Rename a chat session header.
 */
export async function renameSession(sessionId, chatHeader) {
  try {
    await db.ai_chat_sessions.update(sessionId, { chat_header: chatHeader, updated_at: new Date().toISOString() });
  } catch (e) {}

  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ chat_header: chatHeader }),
  });
  if (!response.ok) throw new Error(`Rename session failed: ${response.status}`);
  return response.json();
}
