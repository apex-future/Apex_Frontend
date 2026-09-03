import { create } from 'zustand';
import db from '../db/apex.db';
import syncService from '../services/syncService';

/** Deduplicate an array of notes by local_id or id, keeping the last occurrence. */
function dedupeNotes(arr) {
  const seen = new Map();
  for (const note of arr) {
    const key = note.local_id || note.localId || note.id || note.supabaseId;
    if (key) seen.set(key, note);
  }
  return [...seen.values()];
}

const useBookNotesStore = create((set, get) => ({
  notes: [],
  loading: false,

  // Load all notes for a specific book.
  // Always replaces state with a fresh deduplicated fetch so stale in-memory
  // duplicates (from back-navigation or repeated effect calls) are cleared.
  fetchNotesByBook: async (bookId) => {
    set({ loading: true });
    try {
      const allBooks = await db.books.toArray().catch(() => []);
      const book = allBooks.find(b =>
        b.id === bookId ||
        b.id === Number(bookId) ||
        String(b.id) === String(bookId) ||
        b.supabaseId === bookId ||
        b.local_id === String(bookId)
      );

      const candidateKeys = new Set([
        bookId,
        String(bookId),
        !isNaN(Number(bookId)) ? Number(bookId) : null,
        book?.id,
        book?.id != null ? String(book.id) : null,
        book?.supabaseId,
        book?.local_id,
      ].filter(k => k !== null && k !== undefined));

      const allNotes = await db.book_notes.toArray().catch(() => []);
      const raw = allNotes.filter(n => candidateKeys.has(n.bookId) || (n.book_id && candidateKeys.has(n.book_id)));
      set({ notes: dedupeNotes(raw), loading: false });
    } catch (error) {
      console.error('[bookNotesStore] fetchNotesByBook error:', error);
      set({ loading: false });
    }
  },

  // Save or update a note (upsert by local_id) — syncs to Supabase via syncService
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
    const cleanBookId = !isNaN(Number(bookId)) && Number(bookId) !== 0 ? Number(bookId) : bookId;

    const noteEntry = {
      local_id: local_id || crypto.randomUUID(),
      bookId: cleanBookId,
      title: title || 'Untitled',
      content,
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
      // Check for existing Dexie record to get supabaseId for update path
      const existing = await db.book_notes.where('local_id').equals(noteEntry.local_id).first()
        || await db.book_notes.filter(n => (n.local_id || n.localId) === noteEntry.local_id).first();

      let id;
      if (existing) {
        id = existing.id;
        await db.book_notes.update(id, noteEntry);

        // Sync update to Supabase (fire-and-forget)
        syncService.updateBookNote(existing.supabaseId, id, {
          title: noteEntry.title,
          content: noteEntry.content,
          template: noteEntry.template,
          word_count: noteEntry.word_count,
        }).catch(err => console.error('[bookNotesStore] Supabase update failed:', err));
      } else {
        id = await db.book_notes.add(noteEntry);

        // Sync new note to Supabase (fire-and-forget)
        syncService.saveBookNote(noteEntry.bookId, {
          ...noteEntry,
          _supabase_book_id: noteData._supabase_book_id,
        }).then(result => {
          // Update Dexie with supabaseId if the sync succeeded
          if (result?.supabaseId) {
            db.book_notes.update(id, { supabaseId: result.supabaseId, synced: true })
              .catch(() => {});
          }
        }).catch(err => console.error('[bookNotesStore] Supabase save failed:', err));
      }

      // Replace any existing entry with the same local_id then deduplicate
      const withoutOld = get().notes.filter(n => (n.local_id || n.localId) !== noteEntry.local_id);
      set({ notes: dedupeNotes([...withoutOld, { ...noteEntry, id }]) });

      return { ...noteEntry, id };
    } catch (error) {
      console.error('[bookNotesStore] saveNote error:', error);
      throw error;
    }
  },

  // Delete a note by local_id — removes from Dexie, Supabase, and in-memory state
  deleteNote: async (localId) => {
    try {
      const record = await db.book_notes.where('local_id').equals(localId).first()
        || await db.book_notes.filter(n => (n.local_id || n.localId) === localId).first();
      if (record) {
        // Delete from both Dexie and Supabase via syncService
        syncService.deleteBookNote(record.supabaseId, record.id)
          .catch(err => console.error('[bookNotesStore] Supabase delete failed:', err));
      }
      set({ notes: get().notes.filter(n => (n.local_id || n.localId) !== localId) });
    } catch (error) {
      console.error('[bookNotesStore] deleteNote error:', error);
      throw error;
    }
  },

  // Get a single note by local_id
  getNoteByLocalId: async (localId) => {
    const direct = await db.book_notes.where('local_id').equals(localId).first();
    if (direct) return direct;
    return await db.book_notes.filter(n => (n.local_id || n.localId) === localId).first();
  },

  // Get summary for all notebooks (counts + recent previews)
  getNotebooksSummary: async (bookIds) => {
    const summary = {};
    try {
      const allBooks = await db.books.toArray().catch(() => []);
      const booksById = new Map();
      for (const b of allBooks) {
        if (b.id != null) {
          booksById.set(b.id, b);
          booksById.set(String(b.id), b);
        }
        if (b.supabaseId) booksById.set(b.supabaseId, b);
        if (b.local_id) booksById.set(b.local_id, b);
      }

      const allDbNotes = await db.book_notes.toArray().catch(() => []);
      const allDbTabs = await db.tabs.toArray().catch(() => []);

      for (const id of bookIds) {
        const book = booksById.get(id) || booksById.get(Number(id)) || booksById.get(String(id));
        const candidateKeys = new Set([
          id,
          String(id),
          !isNaN(Number(id)) ? Number(id) : null,
          book?.id,
          book?.id != null ? String(book.id) : null,
          book?.supabaseId,
          book?.local_id,
        ].filter(k => k !== null && k !== undefined));

        const matchedNotes = allDbNotes.filter(n => candidateKeys.has(n.bookId) || (n.book_id && candidateKeys.has(n.book_id)));
        const unique = dedupeNotes(matchedNotes);
        const sorted = unique.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

        const matchedTabs = allDbTabs.filter(t => candidateKeys.has(t.bookId) || (t.book_id && candidateKeys.has(t.book_id)));

        summary[id] = {
          count: unique.length,
          tabsCount: matchedTabs.length,
          recent: sorted.slice(0, 3),
        };
      }
    } catch (err) {
      console.error('[bookNotesStore] error fetching summary:', err);
    }
    return summary;
  },
}));

export default useBookNotesStore;
