import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { shelves as initialShelves } from '../data/shelves';
import db from '../db/apex.db';
import syncService from '../services/syncService';

import { BookContext } from './BookContextInstance.jsx';

export const BookProvider = ({ children }) => {
  const [shelves, setShelves] = useState(initialShelves);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Memoize books array to avoid recreating it on every shelf update
  const books = useMemo(() => {
    const allBooks = (shelves || []).flatMap((shelf) => shelf.books || []);
    const uniqueBooks = [];
    const seen = new Set();
    for (const book of allBooks) {
      if (!seen.has(book.id)) {
        seen.add(book.id);
        uniqueBooks.push(book);
      }
    }
    return uniqueBooks;
  }, [shelves]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await db.books.toArray();

        if (storedBooks && Array.isArray(storedBooks) && storedBooks.length > 0) {
          // Reconstruct File objects from stored ArrayBuffers
          const hydratedBooks = storedBooks.map(b => {
            if (b.fileBlob && !b.file) {
              const blob = new Blob([b.fileBlob], { type: b.fileType || 'application/pdf' });
              const file = new File([blob], b.title + (b.fileType === 'application/epub+zip' ? '.epub' : '.pdf'), { type: b.fileType || 'application/pdf' });
              return { ...b, file };
            }
            return b;
          });

          // Load reading progress — match by both Dexie integer ID AND Supabase UUID
          const progressRecords = await db.reading_progress.toArray();
          const progressMap = {};
          for (const p of progressRecords) {
            const key = p.bookId; // Could be integer (local) or UUID (pulled)
            if (!progressMap[key] || new Date(p.lastReadAt) > new Date(progressMap[key].lastReadAt)) {
              progressMap[key] = p;
            }
          }

          // Load highlights from Dexie highlights table (includes pulled records)
          const allHighlights = await db.highlights.toArray();
          const highlightsByBook = {};
          for (const h of allHighlights) {
            const key = h.bookId;
            if (!highlightsByBook[key]) highlightsByBook[key] = [];
            highlightsByBook[key].push({
              id: h.id,
              text: h.highlightedText,
              highlightedText: h.highlightedText,
              color: h.color,
              page: h.pageNumber,
              pageNumber: h.pageNumber,
              position: h.textPosition,
              textPosition: h.textPosition,
              note: h.note,
              addedAt: h.createdAt,
              supabaseId: h.supabaseId,
              dexieId: h.id,
            });
          }

          // Load bookmarks from Dexie bookmarks table (includes pulled records)
          const allBookmarks = await db.bookmarks.toArray();
          const bookmarksByBook = {};
          for (const bm of allBookmarks) {
            const key = bm.bookId;
            if (!bookmarksByBook[key]) bookmarksByBook[key] = [];
            bookmarksByBook[key].push({
              page: bm.pageNumber,
              label: bm.label || `Page ${bm.pageNumber}`,
              addedAt: bm.createdAt,
              supabaseId: bm.supabaseId,
              dexieId: bm.id,
            });
          }

          const booksWithProgress = hydratedBooks.map(b => {
            // Match by Dexie integer id OR Supabase UUID
            const progress = progressMap[b.id] || progressMap[b.supabaseId];

            // Merge highlights: combine metadata-stored + Dexie table highlights
            const metadataHighlights = b.metadata?.highlights || [];
            const tableHighlights = highlightsByBook[b.id] || highlightsByBook[b.supabaseId] || [];
            // Deduplicate: if a highlight exists in both, prefer the table version
            const existingTexts = new Set(tableHighlights.map(h => h.highlightedText?.toLowerCase()));
            const uniqueMetaHighlights = metadataHighlights.filter(
              h => !existingTexts.has((h.text || h.highlightedText || '').toLowerCase())
            );
            const mergedHighlights = [...tableHighlights, ...uniqueMetaHighlights];

            // Merge bookmarks
            const metadataBookmarks = b.metadata?.bookmarks || [];
            const tableBookmarks = bookmarksByBook[b.id] || bookmarksByBook[b.supabaseId] || [];
            const existingPages = new Set(tableBookmarks.map(bm => bm.page));
            const uniqueMetaBookmarks = metadataBookmarks.filter(bm => !existingPages.has(bm.page));
            const mergedBookmarks = [...tableBookmarks, ...uniqueMetaBookmarks].sort((a, c) => a.page - c.page);

            return {
              ...b,
              progress: progress?.progressPercentage || b.progress || 0,
              currentPage: progress?.currentPage || b.currentPage || 1,
              metadata: {
                ...(b.metadata || {}),
                highlights: mergedHighlights,
                bookmarks: mergedBookmarks,
              },
            };
          });

          setShelves(prevShelves => {
            const currentShelfNames = prevShelves.map(s => s.shelfName);
            return prevShelves.map(shelf => {
              const shelfBooks = booksWithProgress.filter(b => {
                if (shelf.shelfName === 'Favorites') {
                  return b.isFavorite;
                }
                if (shelf.shelfName === 'Bookmarks') {
                  return b.isBookmarked;
                }
                // If it's the Active Reading shelf, include its own books, 
                // books with no shelf, and books with a shelf that no longer exists
                if (shelf.shelfName === 'Active Reading') {
                  const isOrphaned = b.shelfName && !currentShelfNames.includes(b.shelfName);
                  return b.shelfName === 'Active Reading' || !b.shelfName || isOrphaned;
                }
                return b.shelfName === shelf.shelfName;
              });
              return { ...shelf, books: shelfBooks };
            });
          });
        }
      } catch (error) {
        console.error("Failed to load books from Dexie:", error);
      }
    };
    loadBooks();
  }, []);

  const addBookToShelf = useCallback(async (fileObject, shelfName = 'Active Reading') => {
    if (!fileObject) return;

    // Duplicate Check: Check if a book with the same title already exists
    const title = fileObject.name || "New Document";
    const isDuplicate = books.some(b => b.title.toLowerCase() === title.toLowerCase());
    
    if (isDuplicate) {
      setShowDuplicateModal(true);
      return;
    }

    // Read file as ArrayBuffer for IndexedDB storage
    const arrayBuffer = await fileObject.arrayBuffer();
    const fileType = fileObject.type || 'application/pdf';

    const newBookData = {
      title: title,
      author: "N/A",
      fileType: fileType,
      fileSize: fileObject.size,
      fileBlob: arrayBuffer,
      coverImage: null,
      totalPages: 1,
      uploadedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      // App-level fields (not in Dexie index, but stored)
      progress: 0,
      currentPage: 0,
      status: 'new',
      shelfName: shelfName,
      lastAccessed: new Date().toISOString(),
      cover: null,
      isLocal: true,
      isFavorite: false,
      isBookmarked: false,
      metadata: {
        bookmarks: [],
        highlights: [],
        notes: [],
      },
    };

    try {
      // First add the book record to get the auto-generated ID
      const newBookBase = { ...newBookData };
      delete newBookBase.id; // Ensure no ID conflict
      
      const id = await db.books.add(newBookBase);
      
      // Update the record with its own ID as local_id for sync tracking
      await db.books.update(id, { local_id: id.toString() });

      // Upload file to Supabase Storage + create metadata record (direct, not through queue)
      if (navigator.onLine) {
        import('../services/syncService').then(async (m) => {
          const result = await m.default.uploadBook(fileObject, title, 'Unknown', id);
          if (!result) {
            // Upload failed — fall back to sync queue for metadata only
            await db.sync_queue.add({
              action: 'upload',
              tableName: 'books',
              local_id: id.toString(),
              payload: { 
                title, 
                author: "Unknown",
                file_type: fileType, 
                file_size: fileObject.size,
                uploaded_at: newBookData.uploadedAt
              },
              createdAt: new Date().toISOString(),
              attempts: 0,
              status: 'pending'
            });
          }
        });
      } else {
        // Offline — queue metadata for sync (file upload when back online via migrateLocalData)
        await db.sync_queue.add({
          action: 'upload',
          tableName: 'books',
          local_id: id.toString(),
          payload: { 
            title, 
            author: "Unknown",
            file_type: fileType, 
            file_size: fileObject.size,
            uploaded_at: newBookData.uploadedAt
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
          status: 'pending'
        });
      }

      // Create in-memory book object with the File for immediate use
      const newBook = {
        ...newBookData,
        id,
        file: fileObject,
      };

      setShelves((prevShelves) =>
        prevShelves.map((shelf) =>
          shelf.shelfName === shelfName
            ? { ...shelf, books: [newBook, ...shelf.books] }
            : shelf
        )
      );
    } catch (error) {
      console.error("Failed to save book to Dexie:", error);
    }
  }, [books]);

  const downloadMissingFile = useCallback(async (bookId) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return null;

      const supabaseId = book.supabaseId || book.recordId;
      if (!supabaseId) {
        console.error("Cannot download book: no supabase ID found");
        return null; // Not synced to cloud
      }

      // Download file blob and cache it in Dexie
      const blob = await syncService.downloadBookFile(supabaseId, bookId);
      if (!blob) return null;

      // Reconstruct the File object for the UI
      const fileExt = book.fileType === 'application/epub+zip' ? '.epub' : '.pdf';
      const fileName = book.title + fileExt;
      const fileType = blob.type || book.fileType || 'application/pdf';
      const file = new File([blob], fileName, { type: fileType });

      // Update shelves state so the reader gets the actual file
      setShelves(prevShelves => prevShelves.map(shelf => ({
        ...shelf,
        books: shelf.books.map(b => b.id === bookId ? { ...b, file, fileBlob: blob } : b)
      })));

      return file;
    } catch (error) {
      console.error("Failed to download missing file:", error);
      return null;
    }
  }, [books]);

  const updateBookProgress = useCallback(async (id, progress, currentPage, totalPages) => {
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === id) {
            updatedBook = { ...book, progress, currentPage, totalPages };
            return updatedBook;
          }
          return book;
        }),
      }));

      if (updatedBook) {
        const now = new Date().toISOString();
        // Update in Dexie books table
        db.books.update(id, { progress, currentPage, totalPages, lastReadAt: now })
          .catch(err => console.error("Failed to update progress in Dexie:", err));

        // Use direct save via syncService (this is debounced inside syncService)
        if (syncService.saveProgress) {
          syncService.saveProgress(id, {
            current_page: currentPage,
            scroll_position: 0,
            progress_percentage: progress,
          });
        }
      }
      return newShelves;
    });
  }, []);

  const toggleBookmark = useCallback(async (bookId, page) => {
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== bookId) return book;

          const existingBookmarks = book.metadata?.bookmarks || [];
          const isBookmarked = existingBookmarks.some(b => b.page === page);
          const nextBookmarks = isBookmarked
            ? existingBookmarks.filter(b => b.page !== page)
            : [
              ...existingBookmarks,
              { page, label: `Page ${page}`, addedAt: new Date().toISOString() },
            ].sort((a, b) => a.page - b.page);

          updatedBook = {
            ...book,
            metadata: { ...(book.metadata || {}), bookmarks: nextBookmarks },
          };
          return updatedBook;
        }),
      }));

      if (updatedBook) {
        db.books.update(bookId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save bookmark metadata:', err));
          
        const isBookmarked = updatedBook.metadata?.bookmarks?.some(b => b.page === page);
        
        if (isBookmarked) {
            // It was added
            syncService.saveBookmark(bookId, { page_number: page, label: `Page ${page}` });
        } else {
            // It was removed. We need to find the record in Dexie to delete it.
            db.bookmarks.where({ bookId, pageNumber: page }).first().then(record => {
                if (record) {
                    syncService.deleteBookmark(record.supabaseId, record.id);
                }
            });
        }
      }
      return newShelves;
    });
  }, []);

  const handleBookClick = useCallback((id) => {
    if (!id) return;
    const targetId = typeof id === 'string' ? parseInt(id) : id;

    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === targetId) {
            updatedBook = { ...book, lastAccessed: new Date().toISOString() };
            return updatedBook;
          }
          return book;
        }),
      }));

      if (updatedBook) {
        db.books.update(targetId, { lastAccessed: new Date().toISOString(), lastReadAt: new Date().toISOString() })
          .catch(err => console.error("Failed to update lastAccessed in Dexie:", err));
      }
      return newShelves;
    });
  }, []);

  const toggleFavorite = useCallback(async (bookId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === targetId) {
            updatedBook = { ...book, isFavorite: !book.isFavorite };
            return updatedBook;
          }
          return book;
        }),
      }));

      if (updatedBook) {
        db.books.update(targetId, { isFavorite: updatedBook.isFavorite })
          .then(async () => {
            const bookRecord = await db.books.get(targetId);
            if (bookRecord?.recordId) {
              await db.sync_queue.add({
                action: 'update',
                tableName: 'books',
                local_id: (bookRecord.local_id || targetId).toString(),
                recordId: bookRecord.recordId,
                payload: { is_favorite: updatedBook.isFavorite },
                createdAt: new Date().toISOString(),
                attempts: 0,
                status: 'pending'
              });
              syncService.triggerSync?.();
            }
          })
          .catch(err => console.error("Failed to update favorite status:", err));
      }
      return newShelves;
    });
  }, []);

  const toggleBookmarkedBook = useCallback(async (bookId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === targetId) {
            updatedBook = { ...book, isBookmarked: !book.isBookmarked };
            return updatedBook;
          }
          return book;
        }),
      }));

      if (updatedBook) {
        db.books.update(targetId, { isBookmarked: updatedBook.isBookmarked })
          .then(async () => {
            const bookRecord = await db.books.get(targetId);
            if (bookRecord?.recordId) {
              await db.sync_queue.add({
                action: 'update',
                tableName: 'books',
                local_id: (bookRecord.local_id || targetId).toString(),
                recordId: bookRecord.recordId,
                payload: { is_bookmarked: updatedBook.isBookmarked },
                createdAt: new Date().toISOString(),
                attempts: 0,
                status: 'pending'
              });
              syncService.triggerSync?.();
            }
          })
          .catch(err => console.error("Failed to update bookmark status:", err));
      }
      return newShelves;
    });
  }, []);

  const deleteBookFromShelves = useCallback(async (id) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    
    // Get the book record before deleting to capture recordId for sync
    const bookRecord = await db.books.get(targetId).catch(() => null);
    
    setShelves((prevShelves) => {
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.filter((book) => book.id !== targetId),
      }));
      
      // Queue delete for sync if the book has been synced to Supabase
      if (bookRecord?.recordId) {
        db.sync_queue.add({
          action: 'delete',
          tableName: 'books',
          local_id: (bookRecord.local_id || targetId).toString(),
          recordId: bookRecord.recordId,
          payload: {},
          createdAt: new Date().toISOString(),
          attempts: 0,
          status: 'pending'
        }).then(() => syncService.triggerSync?.())
          .catch(err => console.error('Failed to queue book delete:', err));
      }
      
      // Delete from Dexie
      db.books.delete(targetId).catch(err => console.error("Failed to delete book:", err));
      // Also clean up related progress and highlights
      db.reading_progress.where('bookId').equals(targetId).delete().catch(() => {});
      db.highlights.where('bookId').equals(targetId).delete().catch(() => {});
      return newShelves;
    });
  }, []);

  const addSavedWord = useCallback(async (bookId, wordObj) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingWords = book.metadata?.words || [];
          // Deduplicate by word string (case-insensitive)
          if (existingWords.some(w => w.word.toLowerCase() === wordObj.word.toLowerCase())) {
            return book;
          }
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              words: [...existingWords, { ...wordObj, addedAt: new Date().toISOString() }],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save word:', err));
      }
      return newShelves;
    });
  }, []);

  const removeSavedWord = useCallback(async (bookId, word) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingWords = book.metadata?.words || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              words: existingWords.filter(w => w.word.toLowerCase() !== word.toLowerCase()),
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to remove word:', err));
      }
      return newShelves;
    });
  }, []);

  const addHighlight = useCallback(async (bookId, highlight) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const highlightId = Date.now();
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingHighlights = book.metadata?.highlights || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              highlights: [...existingHighlights, { ...highlight, id: highlightId }],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save highlight metadata:', err));

        // Direct save via syncService
        syncService.saveHighlight(targetId, {
          highlighted_text: highlight.text || highlight.highlightedText || '',
          color: highlight.color || 'yellow',
          page_number: highlight.page || highlight.pageNumber || 0,
          text_position: highlight.position || highlight.textPosition || '',
          note: highlight.note || null,
        }).then((savedRecord) => {
            // Optionally update the in-memory metadata array to have the real ID
            // so deleting works identically but for now relying on metadata matching is fine
            // since we use local mapping
        });
      }
      return newShelves;
    });
  }, []);

  const removeHighlight = useCallback(async (bookId, highlightId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    
    // Get highlight record before removing to capture recordId for sync
    const highlightRecord = await db.highlights
      .where('local_id').equals(highlightId.toString())
      .first()
      .catch(() => null);
    
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingHighlights = book.metadata?.highlights || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              highlights: existingHighlights.filter(h => h.id !== highlightId),
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to remove highlight metadata:', err));

        // Delete via syncService if we have a record
        if (highlightRecord) {
            syncService.deleteHighlight(highlightRecord.supabaseId, highlightRecord.id);
        }
      }
      return newShelves;
    });
  }, []);

  return (
    <BookContext.Provider value={{
      shelves,
      books,
      addBookToShelf,
      downloadMissingFile,
      updateBookProgress,
      handleBookClick,
      toggleBookmark,
      toggleFavorite,
      toggleBookmarkedBook,
      deleteBookFromShelves,
      addSavedWord,
      removeSavedWord,
      addHighlight,
      removeHighlight,
      showDuplicateModal,
      setShowDuplicateModal,
    }}>
      {children}
    </BookContext.Provider>
  );
};
