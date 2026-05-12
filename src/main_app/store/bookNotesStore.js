import { create } from 'zustand';
import db from '../db/apex.db';

const useBookNotesStore = create((set, get) => ({
  notes: [],
  loading: false,

  // Load all notes for a specific book
  fetchNotesByBook: async (bookId) => {
    set({ loading: true });
    try {
      const bookNotes = await db.book_notes
        .where('bookId')
        .equals(Number(bookId))
        .toArray();
      set({ notes: bookNotes, loading: false });
    } catch (error) {
      console.error('[bookNotesStore] fetchNotesByBook error:', error);
      set({ loading: false });
    }
  },

  // Save or update a note
  saveNote: async (noteData) => {
    const {
      local_id,
      bookId,
      title,
      content,
      template = 'blank',
      word_count = 0,
    } = noteData;

    const now = new Date().toISOString();
    
    // Construct note object
    const noteEntry = {
      local_id: local_id || crypto.randomUUID(),
      bookId: Number(bookId),
      title: title || 'Untitled',
      content, // JSONB blocks from TipTap
      template,
      word_count,
      updatedAt: now,
      last_modified: Date.now(),
      synced: 0,
    };

    if (!noteData.createdAt) {
      noteEntry.createdAt = now;
    } else {
      noteEntry.createdAt = noteData.createdAt;
    }

    try {
      // Upsert using local_id as the unique key for our logic, 
      // but Dexie uses the primary key 'id' for actual storage.
      // We'll search by local_id first.
      const existing = await db.book_notes.where('local_id').equals(noteEntry.local_id).first();
      
      let id;
      if (existing) {
        id = existing.id;
        await db.book_notes.update(id, noteEntry);
      } else {
        id = await db.book_notes.add(noteEntry);
      }

      // Update local state
      const updatedNotes = get().notes.filter(n => n.local_id !== noteEntry.local_id);
      set({ notes: [...updatedNotes, { ...noteEntry, id }] });
      
      return { ...noteEntry, id };
    } catch (error) {
      console.error('[bookNotesStore] saveNote error:', error);
      throw error;
    }
  },

  // Get a single note by local_id
  getNoteByLocalId: async (localId) => {
    return await db.book_notes.where('local_id').equals(localId).first();
  }
}));

export default useBookNotesStore;
