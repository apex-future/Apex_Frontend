/**
 * quizService.js
 * Owns all quiz-related Dexie reads/writes and API orchestration.
 * Supabase sync is fire-and-forget — failures do not block the user.
 */
import { pdfjs } from 'react-pdf';
import db from '../db/apex.db';
import { generateQuiz as apiGenerateQuiz, gradeEssay as apiGradeEssay } from './aiService';
import apiClient from './apiClient';
import useXpStore from '../store/useXpStore';
import useQuestStore from '../store/useQuestStore';
import { XP_VALUES } from '../../config/xpConfig';

// ─── Helpers ────────────────────────────────────────────────

/**
 * Extract visible text from PDF DOM or pdfjs for a list of page numbers.
 * Returns array of { page: number, text: string }.
 * Pages with no text layer (image-based PDFs) return empty string for that page.
 */
export async function extractPageTexts(selectedPages, fileUrl = null) {
  console.log('[QuizService] Extracting text from pages:', selectedPages, 'fileUrl provided:', !!fileUrl);
  const textMap = {};

  // Method 1: If fileUrl is provided (PDF file), extract text using pdfjs
  if (fileUrl) {
    try {
      const loadingTask = pdfjs.getDocument(fileUrl);
      const docProxy = await loadingTask.promise;
      for (const pageNum of selectedPages) {
        try {
          if (pageNum > 0 && pageNum <= docProxy.numPages) {
            const page = await docProxy.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (pageText) {
              textMap[pageNum] = pageText;
            }
          }
        } catch (e) {
          console.warn(`[QuizService] pdfjs text extraction failed for page ${pageNum}:`, e);
        }
      }
    } catch (err) {
      console.warn('[QuizService] Failed to load PDF via pdfjs for text extraction:', err);
    }
  }

  // Method 2: Fallback to DOM elements for any pages missing text
  const pageWrappers = document.querySelectorAll('.pdf-page-wrapper');
  pageWrappers.forEach(wrapper => {
    const pageIdx = parseInt(wrapper.dataset.pageIndex, 10);
    if (selectedPages.includes(pageIdx) && (!textMap[pageIdx] || textMap[pageIdx].trim().length === 0)) {
      const textLayer = wrapper.querySelector('.react-pdf__Page__textContent');
      const text = textLayer ? (textLayer.innerText || textLayer.textContent || '').trim() : '';
      if (text) {
        textMap[pageIdx] = text;
      }
    }
  });

  const result = selectedPages.map(p => ({ page: p, text: textMap[p] || '' }));
  console.log('[QuizService] Extracted page texts:', result.map(r => ({ page: r.page, chars: r.text.length })));
  return result;
}

/**
 * Convert quizTime string ('5m', '10m', '15m', 'None') to seconds.
 */
export function quizTimeToSeconds(quizTime) {
  if (!quizTime || quizTime === 'None') return null;
  const minutes = parseInt(quizTime, 10);
  return isNaN(minutes) ? null : minutes * 60;
}

// ─── Dexie operations ───────────────────────────────────────

/**
 * Save a new quiz row to Dexie and fire-and-forget sync to Supabase.
 * Returns the Dexie record id.
 */
export async function saveQuizToLocal(quizData) {
  console.log('[QuizService] Saving quiz to Dexie:', quizData);
  const id = await db.quizzes.add({
    ...quizData,
    synced: false,
    taken_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log('[QuizService] Quiz saved to Dexie with id:', id);
  return id;
}

/**
 * Update an existing quiz row in Dexie (on completion) and sync.
 */
export async function updateQuizInLocal(dexieId, updates) {
  console.log('[QuizService] Updating quiz in Dexie:', dexieId, updates);
  await db.quizzes.update(dexieId, {
    ...updates,
    updated_at: new Date().toISOString(),
  });
  console.log('[QuizService] Quiz updated in Dexie');
}

/**
 * Fetch all quizzes for a given book from Dexie, newest first.
 */
export async function getQuizzesForBook(bookId) {
  console.log('[QuizService] Fetching quizzes for book:', bookId);
  // bookId in Dexie is stored as the local integer id (string form)
  const quizzes = await db.quizzes
    .where('bookId')
    .equals(String(bookId))
    .reverse()
    .sortBy('taken_at');
  console.log('[QuizService] Found quizzes:', quizzes.length);
  return quizzes;
}

// ─── Supabase sync (fire-and-forget) ────────────────────────

async function syncQuizToSupabase(dexieId, quizData, userId, supabaseBookId) {
  try {
    console.log('[QuizService] Syncing quiz to Supabase...');
    const payload = {
      user_id: userId,
      book_id: supabaseBookId,
      question_count: quizData.question_count,
      time_limit_seconds: quizData.time_limit_seconds,
      question_type: quizData.question_type,
      difficulty: quizData.difficulty,
      score_percentage: quizData.score_percentage ?? null,
      correct_answers_count: quizData.correct_answers_count ?? null,
      time_taken_seconds: quizData.time_taken_seconds ?? null,
      completed: quizData.completed ?? false,
      questions_payload: quizData.questions_payload,
      selected_pages: quizData.selected_pages,
      taken_at: quizData.taken_at,
    };

    const response = await apiClient.post('/api/ai/quiz/save', payload);
    const supabaseId = response.data?.id;
    if (supabaseId) {
      await db.quizzes.update(dexieId, { supabaseId, synced: true });
      console.log('[QuizService] Quiz synced to Supabase:', supabaseId);
    }
  } catch (err) {
    console.error('[QuizService] Supabase sync failed (non-blocking):', err);
  }
}

// ─── Main orchestration ─────────────────────────────────────

/**
 * Full MCQ quiz flow:
 * 1. Extract page texts from DOM
 * 2. Call Gemini to generate questions
 * 3. Save to Dexie (incomplete row)
 * 4. Return { dexieId, questionsPayload }
 */
export async function initiateMCQQuiz({ bookId, supabaseBookId, bookTitle, userId, selectedPages, numQuestions, quizTime, difficulty, fileUrl }) {
  console.log('[QuizService] Initiating MCQ quiz...');
  const pageTexts = await extractPageTexts(selectedPages, fileUrl);

  const totalChars = pageTexts.reduce((sum, pt) => sum + (pt.text || '').trim().length, 0);
  if (totalChars < 30) {
    const pagesStr = selectedPages.length > 0 ? selectedPages.join(', ') : 'selected';
    throw new Error(`Cannot generate quiz: No readable text found on page(s) ${pagesStr}. Please select pages with text content.`);
  }

  const { questions_payload } = await apiGenerateQuiz({
    bookId: supabaseBookId,
    bookTitle,
    pageTexts,
    selectedPages,
    numQuestions,
    quizTime,
    questionType: 'multiple_choice',
    difficulty,
  });

  console.log('[QuizService] MCQ questions received:', questions_payload.length);

  const quizData = {
    bookId: String(bookId),
    question_type: 'multiple_choice',
    difficulty,
    question_count: questions_payload.length,
    time_limit_seconds: quizTimeToSeconds(quizTime),
    selected_pages: selectedPages,
    questions_payload,
    completed: false,
    score_percentage: null,
    correct_answers_count: null,
    time_taken_seconds: null,
  };

  const dexieId = await saveQuizToLocal(quizData);
  // Don't sync to Supabase here — the incomplete row will be synced
  // once the quiz is completed (completeMCQQuiz), avoiding duplicate inserts.

  return { dexieId, questionsPayload: questions_payload };
}

/**
 * Full essay quiz flow:
 * 1. Extract page texts
 * 2. Gemini generates questions + model answers
 * 3. Save incomplete row to Dexie
 * 4. Return { dexieId, questionsPayload }
 */
export async function initiateEssayQuiz({ bookId, supabaseBookId, bookTitle, userId, selectedPages, numQuestions, quizTime, difficulty, fileUrl }) {
  console.log('[QuizService] Initiating essay quiz...');
  const pageTexts = await extractPageTexts(selectedPages, fileUrl);

  const totalChars = pageTexts.reduce((sum, pt) => sum + (pt.text || '').trim().length, 0);
  if (totalChars < 30) {
    const pagesStr = selectedPages.length > 0 ? selectedPages.join(', ') : 'selected';
    throw new Error(`Cannot generate quiz: No readable text found on page(s) ${pagesStr}. Please select pages with text content.`);
  }

  const { questions_payload } = await apiGenerateQuiz({
    bookId: supabaseBookId,
    bookTitle,
    pageTexts,
    selectedPages,
    numQuestions,
    quizTime,
    questionType: 'short_essay',
    difficulty,
  });

  console.log('[QuizService] Essay questions received:', questions_payload.length);

  const quizData = {
    bookId: String(bookId),
    question_type: 'short_essay',
    difficulty,
    question_count: questions_payload.length,
    time_limit_seconds: quizTimeToSeconds(quizTime),
    selected_pages: selectedPages,
    questions_payload,
    completed: false,
    score_percentage: null,
    correct_answers_count: null,
    time_taken_seconds: null,
  };

  const dexieId = await saveQuizToLocal(quizData);
  // Don't sync to Supabase here — the incomplete row will be synced
  // once the quiz is completed (completeEssayQuiz), avoiding duplicate inserts.

  return { dexieId, questionsPayload: questions_payload };
}

/**
 * Complete an MCQ quiz:
 * Score is calculated from user answers vs correct answers.
 * Updates Dexie row and re-syncs.
 */
export async function completeMCQQuiz({ dexieId, questionsPayload, timeTakenSeconds, userId, supabaseBookId }) {
  console.log('[QuizService] Completing MCQ quiz, dexieId:', dexieId);

  const total = questionsPayload.length;
  const correct = questionsPayload.filter(q => q.user_answer === q.correct_answer).length;
  const score_percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const updates = {
    questions_payload: questionsPayload,
    completed: true,
    score_percentage,
    correct_answers_count: correct,
    time_taken_seconds: timeTakenSeconds,
  };

  await updateQuizInLocal(dexieId, updates);

  // Re-sync with completed data
  const quiz = await db.quizzes.get(dexieId);
  if (quiz) syncQuizToSupabase(dexieId, { ...quiz, ...updates }, userId, supabaseBookId).catch(() => {});

  // Award XP for quiz
  const earnedXp = Math.max(XP_VALUES.quiz_min, Math.floor(score_percentage * XP_VALUES.quiz_per_score_point));
  useXpStore.getState().awardXpOptimistic('quiz', { score_percentage }, earnedXp);

  useQuestStore.getState().reportAction('quiz_completed', 1);
  console.log('[Quest Wire] quiz_completed reported');

  console.log('[QuizService] MCQ quiz completed. Score:', score_percentage);
  return { score_percentage, correct, total };
}

/**
 * Complete an essay quiz:
 * Sends to Groq for grading, merges scores, calculates average.
 */
export async function completeEssayQuiz({ dexieId, questionsPayload, timeTakenSeconds, userId, supabaseBookId }) {
  console.log('[QuizService] Grading essay quiz, dexieId:', dexieId);

  const gradingInput = questionsPayload.map(q => ({
    id: q.id,
    question: q.question,
    model_answer: q.model_answer,
    user_answer: q.user_answer || '',
  }));

  const { scores } = await apiGradeEssay({ bookId: supabaseBookId, questions: gradingInput });
  console.log('[QuizService] Essay scores received:', scores);

  // Merge scores back into questions_payload
  const scoredPayload = questionsPayload.map(q => {
    const result = scores.find(s => s.id === q.id);
    return { ...q, score: result?.score ?? 0 };
  });

  const avgScore = Math.round(
    scoredPayload.reduce((sum, q) => sum + (q.score ?? 0), 0) / scoredPayload.length
  );

  const updates = {
    questions_payload: scoredPayload,
    completed: true,
    score_percentage: avgScore,
    correct_answers_count: null, // N/A for essays
    time_taken_seconds: timeTakenSeconds,
  };

  await updateQuizInLocal(dexieId, updates);

  const quiz = await db.quizzes.get(dexieId);
  if (quiz) syncQuizToSupabase(dexieId, { ...quiz, ...updates }, userId, supabaseBookId).catch(() => {});

  // Award XP for quiz
  const earnedXp = Math.max(XP_VALUES.quiz_min, Math.floor(avgScore * XP_VALUES.quiz_per_score_point));
  useXpStore.getState().awardXpOptimistic('quiz', { score_percentage: avgScore }, earnedXp);

  useQuestStore.getState().reportAction('quiz_completed', 1);
  console.log('[Quest Wire] quiz_completed reported');

  console.log('[QuizService] Essay quiz completed. Avg score:', avgScore);
  return { score_percentage: avgScore, total: scoredPayload.length };
}
