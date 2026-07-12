import { create } from 'zustand';

const useFlashcardStore = create((set) => ({
  isOpen: false,
  sourceType: null, // "note", "highlight", "book_pages"
  textContent: null, // string
  bookTitle: null,
  bookId: null,
  pageTexts: null, // array of { page, text }
  numCards: 10,
  
  openFlashcardModal: (payload) => set({
    isOpen: true,
    ...payload
  }),
  
  closeFlashcardModal: () => set({
    isOpen: false,
    sourceType: null,
    textContent: null,
    bookTitle: null,
    bookId: null,
    pageTexts: null,
    numCards: 10,
  })
}));

export default useFlashcardStore;
