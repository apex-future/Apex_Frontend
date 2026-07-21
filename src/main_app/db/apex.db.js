import Dexie from 'dexie';

const db = new Dexie('ApexDB');

// Version 4 → 5: Normalize field name from localId → local_id for consistency
// across bookmarks, highlights, reading_progress, ai_conversations, user_dictionary_history
db.version(4).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId',
  ai_conversations: '++id, bookId, userId, chatType, localId, synced, supabaseId, queryText, aiResponse, createdAt',
  bookmarks: '++id, bookId, userId, pageNumber, localId, synced, supabaseId, label, createdAt',
  user_dictionary_history: '++id, userId, word, localId, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
});

db.version(5).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
}).upgrade(async tx => {
  // Fix localId → local_id for bookmarks
  await tx.table('bookmarks').toCollection().modify(bookmark => {
    if (bookmark.localId && !bookmark.local_id) {
      bookmark.local_id = bookmark.localId;
      delete bookmark.localId;
    }
  });
  // Fix for highlights
  await tx.table('highlights').toCollection().modify(highlight => {
    if (highlight.localId && !highlight.local_id) {
      highlight.local_id = highlight.localId;
      delete highlight.localId;
    }
  });
  // Fix for reading_progress
  await tx.table('reading_progress').toCollection().modify(progress => {
    if (progress.localId && !progress.local_id) {
      progress.local_id = progress.localId;
      delete progress.localId;
    }
  });
  // Fix for ai_conversations
  await tx.table('ai_conversations').toCollection().modify(conv => {
    if (conv.localId && !conv.local_id) {
      conv.local_id = conv.localId;
      delete conv.localId;
    }
  });
});

db.version(6).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
});

db.version(7).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
  // NEW — notes stored in dedicated table, not book metadata
  notes: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt',
});

db.version(8).stores({
  // Category A tables — add last_modified for sync conflict resolution
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId, last_modified',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId, last_modified',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt, updatedAt, last_modified',
  notes: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt, updatedAt, last_modified',
  // Category B and utility tables — unchanged
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
});

db.version(9).stores({
  // carry forward all v8 tables unchanged:
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId, last_modified',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId, last_modified',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt, updatedAt, last_modified',
  notes: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt, updatedAt, last_modified',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
  // NEW:
  quizzes: '++id, bookId, supabaseId, question_type, difficulty, completed, taken_at, synced',
});

db.version(10).stores({
  // carry forward all v9 tables unchanged:
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId, last_modified',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId, last_modified',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt, updatedAt, last_modified',
  notes: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt, updatedAt, last_modified',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
  quizzes: '++id, bookId, supabaseId, question_type, difficulty, completed, taken_at, synced',
  // NEW:
  book_spaces: '++id, local_id, supabaseId, name, cover_color, synced, createdAt, updatedAt',
  book_space_books: '++id, local_id, supabaseId, spaceLocalId, spaceSupabaseId, bookSupabaseId, synced, addedAt',
});

db.version(11).stores({
  // carry forward all v10 tables unchanged:
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId, last_modified',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId, last_modified',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt, updatedAt, last_modified',
  notes: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt, updatedAt, last_modified',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
  quizzes: '++id, bookId, supabaseId, question_type, difficulty, completed, taken_at, synced',
  book_spaces: '++id, local_id, supabaseId, name, cover_color, synced, createdAt, updatedAt',
  book_space_books: '++id, local_id, supabaseId, spaceLocalId, spaceSupabaseId, bookSupabaseId, synced, addedAt',
  // NEW:
  exam_reminders: '++id, local_id, supabaseId, examName, examDate, isActive, bookSpaceSupabaseId, synced, createdAt, updatedAt',
});

db.version(14).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified, outline',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId, last_modified',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId, last_modified',
  bookmarks: '++id, bookId, userId, pageNumber, local_id, synced, supabaseId, label, createdAt, updatedAt, last_modified',
  tabs: '++id, local_id, bookId, supabaseId, noteType, synced, createdAt, updatedAt, last_modified',
  book_notes: '++id, local_id, bookId, supabaseId, title, content, template, word_count, synced, createdAt, updatedAt, last_modified',
  ai_conversations: '++id, bookId, userId, chatType, local_id, synced, supabaseId, queryText, aiResponse, createdAt',
  user_dictionary_history: '++id, userId, word, local_id, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
  chats: '++id, title, scope, updatedAt',
  quizzes: '++id, bookId, supabaseId, question_type, difficulty, completed, taken_at, synced',
  book_spaces: '++id, local_id, supabaseId, name, cover_color, synced, createdAt, updatedAt',
  book_space_books: '++id, local_id, supabaseId, spaceLocalId, spaceSupabaseId, bookSupabaseId, synced, addedAt',
  exam_reminders: '++id, local_id, supabaseId, examName, examDate, isActive, bookSpaceSupabaseId, synced, createdAt, updatedAt',
});

// Version 15: Add sync_status + sync_retry_count fields to books
// sync_status drives sync indicator dots on book cards
// sync_retry_count persists retry attempts across app sessions
db.version(15).stores({
  // Only books changes — sync_status added to the index list
  // All other tables are unchanged; omitting them from stores() is correct Dexie behaviour
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId, last_modified, outline, sync_status',
}).upgrade(async tx => {
  console.log('[Apex DB] v15 migration: adding sync_status and sync_retry_count to books');
  await tx.table('books').toCollection().modify(book => {
    if (book.supabaseId) {
      book.sync_status = 'synced';
    } else {
      book.sync_status = 'pending';
    }
    book.sync_retry_count = 0;
  });
  console.log('[Apex DB] v15 migration complete');
});

// Version 16: Add page_visits table for per-page reading visit tracking
// Each row = one page visited for ≥5s foreground time. Used to compute progress_today.
db.version(16).stores({
  page_visits: '++id, local_id, bookId, supabaseBookId, pageNumber, visitedAt, synced',
}).upgrade(async tx => {
  console.log('[Apex DB] v16: page_visits table added');
});

// Version 17: Add book_reading_time table for real reading time tracking
// Each row = one day's accumulated minutes for a given book. Synced to Supabase via sync queue.
db.version(17).stores({
  book_reading_time: '++id, bookId, supabaseBookId, date, minutes, synced',
}).upgrade(async () => {
  console.log('[Apex DB] v17: book_reading_time table added');
});

// Version 18: Add compound indexes to book_reading_time
db.version(18).stores({
  book_reading_time: '++id, bookId, supabaseBookId, date, [bookId+date], [supabaseBookId+date], minutes, synced',
}).upgrade(async () => {
  console.log('[Apex DB] v18: book_reading_time compound indexes added');
});

// Version 19: Add offline_dictionary table for local lookups
db.version(19).stores({
  offline_dictionary: 'word',
}).upgrade(async () => {
  console.log('[Apex DB] v19: offline_dictionary table added');
});

// Version 20: Add study_decks and flashcards for local flashcard saving
db.version(20).stores({
  study_decks: '++id, local_id, title, source_type, bookId, createdAt, synced',
  flashcards: '++id, local_id, deckId, question, answer, createdAt, synced',
}).upgrade(async () => {
  console.log('[Apex DB] v20: study_decks and flashcards tables added');
});

// Version 21: Add quest_state and quest_stats_cache for offline quest caching
// quest_state holds today's quest structure and progress per user (1 row per user)
// quest_stats_cache holds today's weekly bar stats per user (1 row per user)
db.version(21).stores({
  quest_state: 'user_id, quest_date',
  quest_stats_cache: 'user_id, stats_date',
}).upgrade(async () => {
  console.log('[Apex DB] v21: quest_state and quest_stats_cache tables added');
});

export default db;
