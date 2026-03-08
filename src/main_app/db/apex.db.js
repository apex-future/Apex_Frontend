import Dexie from 'dexie';

const db = new Dexie('ApexDB');

db.version(4).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt, synced, supabaseId',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt, synced, supabaseId',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt, synced, supabaseId',
  ai_conversations: '++id, bookId, userId, chatType, localId, synced, supabaseId, queryText, aiResponse, createdAt',
  bookmarks: '++id, bookId, userId, pageNumber, localId, synced, supabaseId, label, createdAt',
  user_dictionary_history: '++id, userId, word, localId, synced, lookedUpAt',
  dictionary_cache: 'word, cachedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: 'key',
});

export default db;
