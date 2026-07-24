import { create } from 'zustand';

const useFlashcardStore = create((set) => ({
  isOpen: false,
  sourceType: null, // "note", "highlight", "book_pages"
  textContent: null, // string
  bookTitle: null,
  bookId: null,
  pageTexts: null, // array of { page, text }
  numCards: 10,
  
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
  },
  
  closeFlashcardModal: () => set({
    isOpen: false,
    sourceType: null,
    textContent: null,
    bookTitle: null,
    bookId: null,
    pageTexts: null,
    numCards: 10,
    sourceCategory: null,
    pageFrom: null,
    pageTo: null,
    wordCount: 10,
    highlights: [],
    tabs: [],
    words: [],
  })
}));

export default useFlashcardStore;
