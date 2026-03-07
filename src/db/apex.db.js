import Dexie from 'dexie';

const db = new Dexie('ApexDB');

db.version(2).stores({
  books: '++id, local_id, recordId, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt',
  reading_progress: '++id, local_id, recordId, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt',
  highlights: '++id, local_id, recordId, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt',
  sync_queue: '++id, action, tableName, local_id, recordId, payload, createdAt, attempts, status',
  app_settings: '++id, key, value',
});

export default db;
