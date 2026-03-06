import Dexie from 'dexie';

const db = new Dexie('ApexDB');

db.version(1).stores({
  books: '++id, title, author, fileType, fileSize, coverImage, totalPages, uploadedAt, lastReadAt',
  reading_progress: '++id, bookId, currentPage, scrollPosition, progressPercentage, lastReadAt',
  highlights: '++id, bookId, userId, highlightedText, color, pageNumber, textPosition, note, createdAt, updatedAt',
  sync_queue: '++id, action, tableName, recordId, payload, createdAt, attempts',
  app_settings: '++id, key, value',
});

export default db;
