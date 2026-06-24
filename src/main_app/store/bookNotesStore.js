import { create } from 'zustand';
import db from '../db/apex.db';
import syncService from '../services/syncService';

/** Deduplicate an array of notes by local_id, keeping the last occurrence. */
function dedupeNotes(arr) {
  const seen = new Map();
  for (const note of arr) seen.set(note.local_id, note);
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
      const raw = await db.book_notes
        .where('bookId')
        .equals(Number(bookId))
        .toArray();
      // Deduplicate by local_id in case the DB somehow has phantom duplicates
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

    const noteEntry = {
      local_id: local_id || crypto.randomUUID(),
      bookId: Number(bookId),
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
      const existing = await db.book_notes.where('local_id').equals(noteEntry.local_id).first();

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
        // saveBookNote will detect the existing Dexie record (by local_id) and
        // only perform the Supabase API call, then update Dexie with the supabaseId
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
      const withoutOld = get().notes.filter(n => n.local_id !== noteEntry.local_id);
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
      const record = await db.book_notes.where('local_id').equals(localId).first();
      if (record) {
        // Delete from both Dexie and Supabase via syncService
        syncService.deleteBookNote(record.supabaseId, record.id)
          .catch(err => console.error('[bookNotesStore] Supabase delete failed:', err));
      }
      set({ notes: get().notes.filter(n => n.local_id !== localId) });
    } catch (error) {
      console.error('[bookNotesStore] deleteNote error:', error);
      throw error;
    }
  },

  // Get a single note by local_id
  getNoteByLocalId: async (localId) => {
    return await db.book_notes.where('local_id').equals(localId).first();
  },

  // Get summary for all notebooks (counts + recent previews)
  getNotebooksSummary: async (bookIds) => {
    const summary = {};
    await Promise.all(bookIds.map(async (id) => {
      try {
        const allNotes = await db.book_notes
          .where('bookId')
          .equals(Number(id))
          .toArray();
        const unique = dedupeNotes(allNotes);
        const sorted = unique.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const tabsCount = await db.tabs.where('bookId').equals(Number(id)).count();

        summary[id] = {
          count: unique.length,
          tabsCount,
          recent: sorted.slice(0, 3),
        };
      } catch (err) {
        console.error(`[bookNotesStore] error fetching summary for book ${id}:`, err);
        summary[id] = { count: 0, tabsCount: 0, recent: [] };
      }
    }));
    return summary;
  },
}));

export default useBookNotesStore;
