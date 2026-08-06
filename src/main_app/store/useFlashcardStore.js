import { create } from 'zustand';
import apiClient from '../services/apiClient';
import useQuestStore from './useQuestStore';
import { showToastGlobal } from '../hooks/useToast';

const useFlashcardStore = create((set, get) => ({
  isOpen: false,
  sourceType: null, // "note", "highlight", "book_pages", "deck"
  textContent: null, // string
  bookTitle: null,
  bookId: null,
  deckId: null,
  pageTexts: null, // array of { page, text }
  numCards: 10,

  // Background Generation State
  isGenerating: false,
  generatedCards: [],
  generationError: null,
  
  // New source-picker fields
  sourceCategory: null,   // 'highlights' | 'tabs' | 'words'
  pageFrom: null,         // int or null
  pageTo: null,           // int or null
  wordCount: 10,          // int, for words source only
  highlights: [],         // raw array passed from ReaderView
  tabs: [],               // raw array passed from ReaderView
  words: [],              // raw array passed from ReaderView
  
  openFlashcardModal: (payload) => {
    console.log('[FlashcardStore] openFlashcardModal called with:', payload);
    set({
      isOpen: true,
      ...payload
    });

    // Automatically launch background generation if payload has valid sourceType for generation
    if (payload.sourceType && payload.sourceType !== 'deck') {
      get().startBackgroundGeneration(payload);
    }
  },
  
  closeFlashcardModal: () => set({
    isOpen: false,
  }),

  startBackgroundGeneration: async (overrideParams) => {
    const state = get();
    const st = overrideParams?.sourceType || state.sourceType || 'highlight';
    const tc = overrideParams?.textContent || state.textContent || '';
    const pt = overrideParams?.pageTexts || state.pageTexts || null;
    const nc = overrideParams?.numCards || state.numCards || 10;

    let finalText = tc;
    if (st === 'book_pages' && pt && pt.length > 0 && !finalText) {
      finalText = pt.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
    }

    if (!finalText) {
      console.warn('[FlashcardStore] No text content provided for generation');
      return;
    }

    set({
      isGenerating: true,
      generatedCards: [],
      generationError: null,
    });

    try {
      showToastGlobal('Generating flashcards in the background...', 'info');

      const response = await apiClient.post('/api/ai/generate-flashcards', {
        source_type: st,
        text_content: finalText,
        page_texts: pt,
        num_cards: nc
      });

      if (response.data && response.data.flashcards) {
        set({
          generatedCards: response.data.flashcards,
          isGenerating: false,
        });

        // Report daily quest progress for generating flashcards
        useQuestStore.getState().reportAction('flashcard_generated', 1);

        // Toast completion notice
        showToastGlobal('Flashcards generated successfully!', 'success');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('[FlashcardStore] Background generation failed:', error);
      const errMsg = error?.response?.data?.detail || error.message || 'Failed to generate flashcards';
      set({
        isGenerating: false,
        generationError: errMsg,
      });
      showToastGlobal('Failed to generate flashcards.', 'error');
    }
  }
}));

export default useFlashcardStore;
