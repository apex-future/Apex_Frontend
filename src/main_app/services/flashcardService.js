import db from '../db/apex.db';
import apiClient from './apiClient';

/**
 * Flashcard Service
 * Manages incremental flashcard generation with AI, deck stats, and spaced repetition sessions.
 */

export const fetchBookDeck = async (bookId) => {
  if (!bookId) return null;
  const strId = bookId.toString();
  let deck = await db.flashcard_decks.where('book_id').equals(strId).first();
  if (!deck) {
    const newDeck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      book_id: strId,
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      total_cards: 0,
      highlight_cards: 0,
      tab_cards: 0,
      word_cards: 0,
    };
    await db.flashcard_decks.add(newDeck);
    deck = newDeck;
  }
  return deck;
};

export const fetchBookCards = async (bookId) => {
  if (!bookId) return [];
  const strId = bookId.toString();
  return await db.flashcard_cards.where('book_id').equals(strId).toArray();
};

export const fetchBookSessions = async (bookId) => {
  if (!bookId) return [];
  const strId = bookId.toString();
  const sessions = await db.flashcard_sessions.where('book_id').equals(strId).toArray();
  return sessions.sort((a, b) => new Date(b.started_at || b.completed_at || 0) - new Date(a.started_at || a.completed_at || 0));
};

/**
 * Call AI backend endpoint to transform a highlight or tab into a structured Q&A flashcard.
 */
export const callFlashcardAI = async ({ sourceType, textContent, userNote, context, bookTitle, pageNumber }) => {
  let formattedText = '';

  if (sourceType === 'highlight') {
    formattedText = `Book: "${bookTitle || 'Book'}" (Page ${pageNumber || 1})
Transform the following highlight into 1 high-yield study flashcard with a direct question on front and explanation/answer on back.

Highlight: "${textContent}"`;
  } else if (sourceType === 'tab') {
    formattedText = `Book: "${bookTitle || 'Book'}" (Page ${pageNumber || 1})
Formulate 1 study flashcard with a targeted question on front and answer on back based on this user note and reading context:

User Note: "${userNote || textContent}"
Highlight Context: "${context || ''}"`;
  }

  try {
    const response = await apiClient.post('/api/ai/generate-flashcards', {
      source_type: sourceType === 'tab' ? 'tab' : 'highlight',
      text_content: formattedText,
      num_cards: 1,
    });

    const data = response.data;
    if (data?.flashcards?.[0]) {
      const card = data.flashcards[0];
      const q = card.question || card.front;
      const a = card.answer || card.back;
      if (q && a) return { question: q, answer: a };
    }

    if (data?.question && data?.answer) {
      return { question: data.question, answer: data.answer };
    }

    // Try parsing raw string response if backend returns text
    const textResp = data?.result || data?.content || data?.response || '';
    if (textResp) {
      const jsonMatch = textResp.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.question && parsed.answer) {
          return { question: parsed.question, answer: parsed.answer };
        }
      }
    }
  } catch (err) {
    console.error(`[FlashcardService] AI Endpoint error for ${sourceType}:`, err?.response?.data || err.message);
  }

  // Return NULL on failure — NO dummy fallback cards saved!
  return null;
};

/**
 * Generate Flashcards incrementally for items where has_flashcard is false / falsey
 */
export const generateIncrementalCards = async (book, onStatusChange) => {
  if (!book) return { count: 0, status: 'info', message: 'No book provided' };

  const bookId = (book.id || book.recordId || book.supabaseId || '').toString();
  const bookTitle = book.title || book.file?.name || 'Book';

  const highlights = book.metadata?.highlights || [];
  const tabs = book.metadata?.tabs || [];
  const words = book.metadata?.words || [];

  // Filter un-generated items
  const ungeneratedHighlights = highlights.filter(h => !h.has_flashcard);
  const ungeneratedTabs = tabs.filter(t => !t.has_flashcard);
  const ungeneratedWords = words.filter(w => !w.has_flashcard);

  const totalNewItems = ungeneratedHighlights.length + ungeneratedTabs.length + ungeneratedWords.length;

  if (totalNewItems === 0) {
    return { count: 0, status: 'info', message: 'All highlights, tabs, and words already have flashcards generated!' };
  }

  onStatusChange?.('Generating flashcards... It might take a minute.');

  const deck = await fetchBookDeck(bookId);
  const newCards = [];
  let aiFailures = 0;
  let aiSuccessCount = 0;
  let wordCount = 0;

  // 1. Process Highlights via Groq AI
  for (const h of ungeneratedHighlights) {
    const text = h.highlightedText || h.text || '';
    if (!text.trim()) continue;

    const pageNum = h.pageNumber || h.page || 1;
    const aiResult = await callFlashcardAI({
      sourceType: 'highlight',
      textContent: text,
      bookTitle,
      pageNumber: pageNum,
    });

    if (aiResult && aiResult.question && aiResult.answer) {
      newCards.push({
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        deck_id: deck.id,
        book_id: bookId,
        source_type: 'highlight',
        source_id: h.id || h.local_id || null,
        page_number: pageNum,
        front: aiResult.question,
        back: aiResult.answer,
        confidence: 'new',
        times_practiced: 0,
        created_at: new Date().toISOString(),
      });
      h.has_flashcard = true;
      aiSuccessCount++;
    } else {
      aiFailures++;
      // Do NOT set h.has_flashcard = true so user can retry later!
    }
  }

  // 2. Process Tabs via Groq AI
  for (const t of ungeneratedTabs) {
    const userNote = t.text || t.content || '';
    const context = t.context || '';
    if (!userNote.trim() && !context.trim()) continue;

    const pageNum = t.pageNumber || t.page || 1;
    const aiResult = await callFlashcardAI({
      sourceType: 'tab',
      textContent: userNote,
      userNote: userNote,
      context: context,
      bookTitle,
      pageNumber: pageNum,
    });

    if (aiResult && aiResult.question && aiResult.answer) {
      newCards.push({
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        deck_id: deck.id,
        book_id: bookId,
        source_type: 'tab',
        source_id: t.id || t.local_id || null,
        page_number: pageNum,
        front: aiResult.question,
        back: aiResult.answer,
        confidence: 'new',
        times_practiced: 0,
        created_at: new Date().toISOString(),
      });
      t.has_flashcard = true;
      aiSuccessCount++;
    } else {
      aiFailures++;
      // Do NOT set t.has_flashcard = true so user can retry later!
    }
  }

  // 3. Process Words (Local Format — Fast, no AI endpoint needed)
  for (const w of ungeneratedWords) {
    const wordText = w.word || '';
    if (!wordText.trim()) continue;

    const def = w.definition || 'Definition not available';
    const pos = w.partOfSpeech ? `(${w.partOfSpeech}) ` : '';
    const ex = w.example ? `\n\nExample: "${w.example}"` : '';
    const backContent = `${pos}${def}${ex}`;

    newCards.push({
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      deck_id: deck.id,
      book_id: bookId,
      source_type: 'word',
      source_id: w.id || w.local_id || null,
      page_number: w.pageNumber || w.page || 1,
      front: wordText,
      back: backContent,
      confidence: 'new',
      times_practiced: 0,
      created_at: new Date().toISOString(),
    });

    w.has_flashcard = true;
    wordCount++;
  }

  // Save generated cards to Dexie
  if (newCards.length > 0) {
    await db.flashcard_cards.bulkAdd(newCards);

    const allBookCards = await fetchBookCards(bookId);
    await db.flashcard_decks.update(deck.id, {
      total_cards: allBookCards.length,
      highlight_cards: allBookCards.filter(c => c.source_type === 'highlight').length,
      tab_cards: allBookCards.filter(c => c.source_type === 'tab').length,
      word_cards: allBookCards.filter(c => c.source_type === 'word').length,
      last_updated_at: new Date().toISOString(),
    });

    try {
      await db.books.update(bookId, { metadata: book.metadata, updated_at: new Date().toISOString() });
    } catch (err) {
      console.warn('[FlashcardService] Failed to update book metadata in Dexie:', err);
    }
  }

  // Toast Messaging Logic
  if (aiFailures > 0) {
    if (wordCount > 0 && aiSuccessCount === 0) {
      return {
        count: newCards.length,
        status: 'warning',
        message: `Flashcards failed to generate for highlights/tabs. Only generated ${wordCount} card(s) for words.`,
      };
    } else if (aiSuccessCount > 0) {
      return {
        count: newCards.length,
        status: 'warning',
        message: `Generated ${newCards.length} flashcard(s). (${aiFailures} item(s) failed AI generation).`,
      };
    } else {
      return {
        count: 0,
        status: 'error',
        message: 'Flashcards failed to generate. Please check AI backend connection and try again.',
      };
    }
  }

  return {
    count: newCards.length,
    status: 'success',
    message: `Successfully generated ${newCards.length} flashcard${newCards.length !== 1 ? 's' : ''}!`,
  };
};

/**
 * Record Spaced Repetition Session Result
 */
export const recordSessionResult = async (bookId, sessionInfo, cardResults) => {
  if (!bookId || !cardResults || cardResults.length === 0) return;

  const strBookId = bookId.toString();
  const easyCount = cardResults.filter(r => r.rating === 'easy').length;
  const hardCount = cardResults.filter(r => r.rating === 'hard').length;
  const missedCount = cardResults.filter(r => r.rating === 'missed').length;

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.flashcard_sessions.add({
    id: sessionId,
    book_id: strBookId,
    sources: sessionInfo.sources || [],
    cards_requested: cardResults.length,
    cards_completed: cardResults.length,
    easy_count: easyCount,
    hard_count: hardCount,
    missed_count: missedCount,
    started_at: sessionInfo.startedAt || new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  const nowStr = new Date().toISOString();
  for (const res of cardResults) {
    const card = await db.flashcard_cards.get(res.cardId);
    if (card) {
      await db.flashcard_cards.update(res.cardId, {
        confidence: res.rating,
        times_practiced: (card.times_practiced || 0) + 1,
        last_practiced_at: nowStr,
      });
    }

    await db.flashcard_session_cards.add({
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      session_id: sessionId,
      card_id: res.cardId,
      rating: res.rating,
      practiced_at: nowStr,
    });
  }
};

/**
 * Delete Cards in Bulk
 */
export const deleteCards = async (cardIds, bookId) => {
  if (!cardIds || cardIds.length === 0) return;

  await db.flashcard_cards.bulkDelete(cardIds);

  if (bookId) {
    const strBookId = bookId.toString();
    const deck = await fetchBookDeck(strBookId);
    if (deck) {
      const remaining = await fetchBookCards(strBookId);
      await db.flashcard_decks.update(deck.id, {
        total_cards: remaining.length,
        highlight_cards: remaining.filter(c => c.source_type === 'highlight').length,
        tab_cards: remaining.filter(c => c.source_type === 'tab').length,
        word_cards: remaining.filter(c => c.source_type === 'word').length,
        last_updated_at: new Date().toISOString(),
      });
    }
  }
};
