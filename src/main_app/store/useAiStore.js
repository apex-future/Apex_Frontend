import { create } from 'zustand';

const useAiStore = create((set) => ({
  currentSessionId: null,
  currentSessionMessages: [],
  lastSessionUpdate: 0,

  setCurrentSessionId: (id) => {
    console.log('[AI Store] Session set:', id);
    set({ currentSessionId: id });
  },

  setCurrentSessionMessages: (messages) => {
    set({ currentSessionMessages: messages || [] });
  },

  appendMessage: (msg) => {
    set((state) => ({
      currentSessionMessages: [...state.currentSessionMessages, msg]
    }));
  },

  clearSession: () => {
    set({ currentSessionId: null, currentSessionMessages: [] });
  },

  // Called after each completed AI response — triggers session list reload in listeners
  markSessionUpdated: () => {
    set({ lastSessionUpdate: Date.now() });
  },
}));

export default useAiStore;
