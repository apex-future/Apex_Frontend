import React, { useState, useCallback, useEffect, useMemo } from 'react';
import db from '../db/apex.db';
import syncService from '../services/syncService';
import { showToastGlobal } from '../hooks/useToast';
import { BookContext } from './BookContextInstance.jsx';
import useSpaceStore from '../store/spaceStore';

export const BookProvider = ({ children }) => {
  const { spaces, addBookToSpace, removeBookFromSpace } = useSpaceStore();
  const [allBooks, setAllBooks] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const shelves = useMemo(() => {
    const currentSpaceNames = spaces.map(s => s.name);
    return spaces.map(space => {
      const spaceBooks = allBooks.filter(b => {
        if (space.id === 'favorites') return b.isFavorite;
        if (space.id === 'bookmarks') return b.isBookmarked;
        if (space.id === 'active-reading') {
          const isOrphaned = b.shelfName && !currentSpaceNames.includes(b.shelfName);
          return b.shelfName === 'Active Reading' || !b.shelfName || isOrphaned;
        }
        return space.bookIds && (space.bookIds.includes(b.id) || space.bookIds.includes(b.supabaseId));
      });
      return { ...space, shelfName: space.name, books: spaceBooks };
    });
  }, [spaces, allBooks]);

  const books = allBooks;

  const setShelves = useCallback((updater) => {
    setAllBooks((prevBooks) => {
      const currentSpaceNames = spaces.map(s => s.name);
      const prevShelves = spaces.map(space => {
        const spaceBooks = prevBooks.filter(b => {
          if (space.id === 'favorites') return b.isFavorite;
          if (space.id === 'bookmarks') return b.isBookmarked;
          if (space.id === 'active-reading') {
            const isOrphaned = b.shelfName && !currentSpaceNames.includes(b.shelfName);
            return b.shelfName === 'Active Reading' || !b.shelfName || isOrphaned;
          }
          return space.bookIds && (space.bookIds.includes(b.id) || space.bookIds.includes(b.supabaseId));
        });
        return { ...space, shelfName: space.name, books: spaceBooks };
      });

      const nextShelves = typeof updater === 'function' ? updater(prevShelves) : updater;

      const newBooksObj = {};
      nextShelves.forEach(shelf => {
        if (shelf.books) {
          shelf.books.forEach(b => {
            newBooksObj[b.id] = b;
          });
        }
      });

      prevBooks.forEach(b => {
        if (!newBooksObj[b.id]) {
          newBooksObj[b.id] = b;
        }
      });

      return Object.values(newBooksObj);
    });
  }, [spaces]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await db.books.toArray();

        if (storedBooks && Array.isArray(storedBooks) && storedBooks.length > 0) {
          // Reconstruct File objects from stored ArrayBuffers
          const hydratedBooks = storedBooks.map(b => {
            if (b.fileBlob && !b.file) {
              const fileExt = b.fileType === 'application/epub+zip' ? '.epub' : 
                          b.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx' : 
                          b.fileType === 'application/msword' ? '.doc' : 
                          '.pdf';
              const file = new File([b.fileBlob], b.title + fileExt, { type: b.fileType || 'application/pdf' });
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

          // Load notes from Dexie notes table
          // Notes are stored by bookId (integer OR supabaseId string)
          const allNotes = await db.notes.toArray();
          const notesByBook = {};
          for (const n of allNotes) {
            const key = n.bookId;
            if (!notesByBook[key]) notesByBook[key] = [];
            notesByBook[key].push({
              id: n.id,           // Dexie integer id — used for UI operations
              dexieId: n.id,
              supabaseId: n.supabaseId,
              text: n.text,
              context: n.context || null,
              type: n.noteType || 'manual_note',
              noteType: n.noteType || 'manual_note',
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
              local_id: n.local_id,
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

            // Merge notes from Dexie notes table
            const tableNotes = notesByBook[b.id] || notesByBook[b.supabaseId] || [];

            return {
              ...b,
              isUploading: false,
              progress: progress?.progressPercentage || b.progress || 0,
              currentPage: progress?.currentPage || b.currentPage || 1,
              metadata: {
                ...(b.metadata || {}),
                highlights: mergedHighlights,
                bookmarks: mergedBookmarks,
                notes: tableNotes, // ← from Dexie notes table, not metadata
              },
            };
          });

          setAllBooks(booksWithProgress);
        }
      } catch (error) {
        console.error("Failed to load books from Dexie:", error);
      }
    };
    loadBooks();
  }, []);

  const addBookToShelf = useCallback(async (fileObject, shelfName = 'Active Reading') => {
    if (!fileObject) return;

    // Duplicate check
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
      title,
      author: "N/A",
      fileType,
      fileSize: fileObject.size,
      fileBlob: arrayBuffer,
      coverImage: null,
      totalPages: 1,
      uploadedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      progress: 0,
      currentPage: 0,
      status: 'new',
      shelfName,
      lastAccessed: new Date().toISOString(),
      cover: null,
      isLocal: true,
      isFavorite: false,
      isBookmarked: false,
      // Flag to show uploading state on the book card
      isUploading: navigator.onLine,
      metadata: {
        bookmarks: [],
        highlights: [],
        notes: [],
      },
    };

    let id;
    try {
      // Step 1: Save to Dexie immediately
      const newBookBase = { ...newBookData };
      delete newBookBase.id;
      id = await db.books.add(newBookBase);
      await db.books.update(id, { local_id: id.toString() });
      console.log('[Apex] Book saved to Dexie with id:', id);
    } catch (err) {
      console.error('[Apex] Failed to save book to Dexie:', err);
      showToastGlobal('Failed to save book. Please try again.', 'error');
      return;
    }

    // Step 2: Add to UI immediately — BEFORE upload
    // isUploading: true shows a loading indicator on the card
    const newBook = {
      ...newBookData,
      id,
      file: fileObject,
    };

    setShelves(prev => prev.map(shelf =>
      shelf.shelfName === shelfName
        ? { ...shelf, books: [newBook, ...shelf.books] }
        : shelf
    ));

    console.log('[Apex] Book added to UI optimistically:', title);

    // Step 3: Reconstruct fresh File from ArrayBuffer
    // Original fileObject stream is consumed after arrayBuffer() — cannot reuse
    const freshBlob = new Blob([arrayBuffer], { type: fileType });
    const freshFile = new File([freshBlob], fileObject.name, { type: fileType });

    if (navigator.onLine) {
      // Show persistent uploading toast — dismissed only when upload resolves
      showToastGlobal('Uploading your book, hang tight...', 'info', 0); // 0 = persistent, no auto-dismiss

      try {
        console.log('[Apex] Starting Supabase upload for:', title);
        const result = await syncService.uploadBook(freshFile, title, 'Unknown', id);

        if (result) {
          console.log('[Apex] Upload successful for:', title, '| supabaseId:', result.id);

          // Update the book in UI to remove uploading state
          setShelves(prev => prev.map(shelf => ({
            ...shelf,
            books: shelf.books.map(b =>
              b.id === id ? { ...b, isUploading: false, supabaseId: result.id } : b
            ),
          })));

          // Dismiss uploading toast and show success
          showToastGlobal('Book uploaded successfully!', 'success');
        } else {
          console.error('[Apex] Upload returned null for:', title);

          // Update UI to remove uploading state even on failure
          setShelves(prev => prev.map(shelf => ({
            ...shelf,
            books: shelf.books.map(b =>
              b.id === id ? { ...b, isUploading: false } : b
            ),
          })));

          // Queue for retry
          await db.sync_queue.add({
            action: 'upload',
            tableName: 'books',
            local_id: id.toString(),
            payload: {
              title,
              author: 'Unknown',
              file_type: fileType,
              file_size: fileObject.size,
              uploaded_at: newBookData.uploadedAt,
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            status: 'pending',
          });

          showToastGlobal('Book saved offline. It will sync when your connection is stable.', 'warning');
        }
      } catch (uploadErr) {
        console.error('[Apex] Upload exception for:', title, uploadErr);

        // Update UI to remove uploading state
        setShelves(prev => prev.map(shelf => ({
          ...shelf,
          books: shelf.books.map(b =>
            b.id === id ? { ...b, isUploading: false } : b
          ),
        })));

        showToastGlobal('Book saved offline. It will sync when your connection is stable.', 'warning');
      }
    } else {
      // Offline — queue for later, no upload toast
      console.log('[Apex] Offline — book saved locally, queued for sync');
      await db.sync_queue.add({
        action: 'upload',
        tableName: 'books',
        local_id: id.toString(),
        payload: {
          title,
          author: 'Unknown',
          file_type: fileType,
          file_size: fileObject.size,
          uploaded_at: newBookData.uploadedAt,
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      });

      showToastGlobal('Book saved offline. It will sync when your connection is stable.', 'warning');
    }
  }, [books]);

  const downloadMissingFile = useCallback(async (bookId) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return null;

      const supabaseId = book.supabaseId || book.recordId;
      if (!supabaseId) {
        console.error('[Apex Sync] Cannot download book: no supabase ID found for bookId:', bookId);
        showToastGlobal('This book hasn\u2019t synced to the cloud yet.', 'warning');
        return null; // Not synced to cloud
      }

      // Show download started toast
      showToastGlobal('Downloading book...', 'info');

      // Download file blob and cache it in Dexie
      const blob = await syncService.downloadBookFile(supabaseId, bookId);
      if (!blob) {
        console.error('[Apex Sync] Download returned null for book:', { bookId, supabaseId });
        showToastGlobal('Download failed. Check your connection and try again.', 'error');
        return null;
      }

      // Reconstruct the File object for the UI
      const fileExt = book.fileType === 'application/epub+zip' ? '.epub' : 
                   book.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx' : 
                   book.fileType === 'application/msword' ? '.doc' : 
                   '.pdf';
      const fileName = book.title + fileExt;
      const fileType = blob.type || book.fileType || 'application/pdf';
      const file = new File([blob], fileName, { type: fileType });

      // Update shelves state so the reader gets the actual file
      setShelves(prevShelves => prevShelves.map(shelf => ({
        ...shelf,
        books: shelf.books.map(b => b.id === bookId ? { ...b, file, fileBlob: blob } : b)
      })));

      showToastGlobal('Book ready to read!', 'success');
      return file;
    } catch (error) {
      console.error('[Apex Sync] Failed to download missing file:', { bookId, error });
      showToastGlobal('Download failed. Check your connection and try again.', 'error');
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
        // Save the new metadata array (with the bookmark removed/added) to Dexie
        db.books.update(bookId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to update bookmark metadata:', err));

        // Bookmarks are stored ONLY in db.bookmarks table for sync (not in db.books metadata)
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
      // Find the updated book state first
      let updatedBook = null;
      prevShelves.forEach(shelf => {
        const found = shelf.books.find(b => b.id === targetId);
        if (found) updatedBook = { ...found, isFavorite: !found.isFavorite };
      });

      if (!updatedBook) return prevShelves;

      // Map over all shelves to ensure the book is added to/removed from 'Favorites'
      const newShelves = prevShelves.map((shelf) => {
        if (shelf.shelfName === 'Favorites') {
          if (updatedBook.isFavorite) {
            const exists = shelf.books.some(b => b.id === targetId);
            return {
              ...shelf,
              books: exists
                ? shelf.books.map(b => b.id === targetId ? updatedBook : b)
                : [...shelf.books, updatedBook]
            };
          } else {
            return { ...shelf, books: shelf.books.filter(b => b.id !== targetId) };
          }
        }
        return {
          ...shelf,
          books: shelf.books.map(b => b.id === targetId ? updatedBook : b)
        };
      });

      db.books.update(targetId, { isFavorite: updatedBook.isFavorite })
        .catch(err => console.error("Failed to update favorite status:", err));

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
      // Find the updated book state first
      let updatedBook = null;
      prevShelves.forEach(shelf => {
        const found = shelf.books.find(b => b.id === targetId);
        if (found) updatedBook = { ...found, isBookmarked: !found.isBookmarked };
      });

      if (!updatedBook) return prevShelves;

      // Map over all shelves to ensure the book is added to/removed from 'Bookmarks'
      const newShelves = prevShelves.map((shelf) => {
        if (shelf.shelfName === 'Bookmarks') {
          if (updatedBook.isBookmarked) {
            const exists = shelf.books.some(b => b.id === targetId);
            return {
              ...shelf,
              books: exists
                ? shelf.books.map(b => b.id === targetId ? updatedBook : b)
                : [...shelf.books, updatedBook]
            };
          } else {
            return { ...shelf, books: shelf.books.filter(b => b.id !== targetId) };
          }
        }
        return {
          ...shelf,
          books: shelf.books.map(b => b.id === targetId ? updatedBook : b)
        };
      });

      db.books.update(targetId, { isBookmarked: updatedBook.isBookmarked })
        .catch(err => console.error("Failed to update bookmark status:", err));

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

  const deleteBookFromShelves = useCallback(async (id, bookFallback = null) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;

    console.log('[Apex] deleteBookFromShelves called for bookId:', targetId);

    try {
      // Step 1: Get full book record from Dexie
      // If Dexie returns null (stale ID after pull sync), fall back to in-memory book object
      let bookRecord = await db.books.get(targetId);

      if (!bookRecord && bookFallback) {
        console.warn('[Apex] Dexie record not found — using in-memory fallback for bookId:', targetId);
        // Construct a minimal bookRecord from the in-memory book object
        // so we still have supabaseId for the Supabase delete queue
        bookRecord = {
          id: targetId,
          supabaseId: bookFallback.supabaseId || bookFallback.recordId || null,
          local_id: bookFallback.local_id || targetId.toString(),
          synced: bookFallback.synced || false,
        };
      }

      console.log('[Apex] Book record for delete:', {
        targetId,
        supabaseId: bookRecord?.supabaseId,
        synced: bookRecord?.synced,
        source: bookRecord ? (bookFallback && !await db.books.get(targetId) ? 'fallback' : 'dexie') : 'none',
      });

      // Step 2: Remove from UI immediately (optimistic)
      // Always do this regardless of whether bookRecord exists
      setShelves(prev => prev.map(shelf => ({
        ...shelf,
        books: shelf.books.filter(b => b.id !== targetId),
      })));

      if (!bookRecord) {
        // No record anywhere — UI removal is all we can do
        console.warn('[Apex] No book record found anywhere for id:', targetId);
        showToastGlobal('Book removed.', 'success');
        return;
      }

      // Step 3: Delete related records from Dexie by BOTH integer ID and supabaseId
      console.log('[Apex] Deleting related records from Dexie...');

      // Bookmarks
      const bookmarksByInt = await db.bookmarks.where('bookId').equals(targetId).toArray();
      const bookmarksByUuid = bookRecord.supabaseId
        ? await db.bookmarks.where('bookId').equals(bookRecord.supabaseId).toArray()
        : [];
      const allBookmarkIds = [...bookmarksByInt, ...bookmarksByUuid].map(b => b.id);
      if (allBookmarkIds.length > 0) {
        await db.bookmarks.bulkDelete(allBookmarkIds);
        console.log('[Apex] Deleted bookmarks:', allBookmarkIds.length);
      }

      // Highlights
      const highlightsByInt = await db.highlights.where('bookId').equals(targetId).toArray();
      const highlightsByUuid = bookRecord.supabaseId
        ? await db.highlights.where('bookId').equals(bookRecord.supabaseId).toArray()
        : [];
      const allHighlightIds = [...highlightsByInt, ...highlightsByUuid].map(h => h.id);
      if (allHighlightIds.length > 0) {
        await db.highlights.bulkDelete(allHighlightIds);
        console.log('[Apex] Deleted highlights:', allHighlightIds.length);
      }

      // Reading Progress
      const progressByInt = await db.reading_progress.where('bookId').equals(targetId).toArray();
      const progressByUuid = bookRecord.supabaseId
        ? await db.reading_progress.where('bookId').equals(bookRecord.supabaseId).toArray()
        : [];
      const allProgressIds = [...progressByInt, ...progressByUuid].map(p => p.id);
      if (allProgressIds.length > 0) {
        await db.reading_progress.bulkDelete(allProgressIds);
        console.log('[Apex] Deleted reading progress:', allProgressIds.length);
      }

      // Also try deleting by supabaseId directly in case Dexie integer lookup missed it
      if (bookRecord.supabaseId) {
        try {
          const bookByUuid = await db.books
            .where('supabaseId').equals(bookRecord.supabaseId)
            .first();
          if (bookByUuid && bookByUuid.id !== targetId) {
            // Found the actual current Dexie record — delete it too
            console.log('[Apex] Found book by supabaseId with different Dexie id:', bookByUuid.id);
            await db.books.delete(bookByUuid.id);
          }
        } catch (err) {
          console.warn('[Apex] supabaseId lookup failed:', err);
        }
      }

      // Delete the book by integer id
      await db.books.delete(targetId).catch(() => {});
      console.log('[Apex] Dexie delete complete for bookId:', targetId);

      // Step 4: Queue Supabase delete if book was synced
      if (bookRecord.supabaseId) {
        console.log('[Apex] Queueing Supabase delete for supabaseId:', bookRecord.supabaseId);

        await db.sync_queue.add({
          action: 'delete',
          tableName: 'books',
          local_id: (bookRecord.local_id || targetId).toString(),
          recordId: bookRecord.supabaseId,
          payload: {},
          createdAt: new Date().toISOString(),
          attempts: 0,
          status: 'pending',
        });

        if (navigator.onLine) {
          console.log('[Apex] Online — triggering immediate sync for delete');
          syncService.triggerSync?.();
        } else {
          console.log('[Apex] Offline — delete queued for when back online');
          showToastGlobal('Book removed. Cloud sync will complete when you\'re back online.', 'info');
        }
      } else {
        console.log('[Apex] Book was local only — no Supabase delete needed');
      }

      showToastGlobal('Book deleted.', 'success');

    } catch (err) {
      console.error('[Apex] deleteBookFromShelves failed:', err);
      showToastGlobal('Failed to delete book. Please try again.', 'error');
    }
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
    const highlightId = Date.now();

    // Update UI state immediately
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
              highlights: [...existingHighlights, { ...highlight, id: highlightId }],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save highlight metadata:', err));
      }
      return newShelves;
    });

    // Direct save via syncService — then patch in-memory highlight with actual IDs
    try {
      const savedRecord = await syncService.saveHighlight(targetId, {
        highlighted_text: highlight.text || highlight.highlightedText || '',
        color: highlight.color || 'yellow',
        page_number: highlight.page || highlight.pageNumber || 0,
        text_position: highlight.position || highlight.textPosition || '',
        note: highlight.note || null,
      });

      if (savedRecord) {
        // Patch the in-memory highlight with the real Dexie ID + supabaseId
        // so that future removeHighlight calls can find the Dexie record
        setShelves(prev => prev.map(shelf => ({
          ...shelf,
          books: shelf.books.map(book => {
            if (book.id !== targetId) return book;
            return {
              ...book,
              metadata: {
                ...(book.metadata || {}),
                highlights: (book.metadata?.highlights || []).map(h =>
                  h.id === highlightId
                    ? { ...h, id: savedRecord.id, dexieId: savedRecord.id, supabaseId: savedRecord.supabaseId || null }
                    : h
                ),
              },
            };
          }),
        })));
      }
    } catch (err) {
      console.error('[Apex] Failed to save highlight via syncService:', err);
    }
  }, []);

  const removeHighlight = useCallback(async (bookId, highlightId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;

    // Get highlight record before removing to capture recordId for sync
    let highlightRecord = null;
    if (typeof highlightId === 'number') {
      highlightRecord = await db.highlights.get(highlightId).catch(() => null);
    }
    
    // Fallback lookups
    if (!highlightRecord) {
      if (typeof highlightId === 'string' && highlightId.includes('-')) {
        highlightRecord = await db.highlights.where('supabaseId').equals(highlightId).first().catch(() => null);
      } else {
        highlightRecord = await db.highlights.where('local_id').equals(highlightId.toString()).first().catch(() => null);
      }
    }

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
              highlights: existingHighlights.filter(h => h.id !== highlightId && h.dexieId !== highlightId),
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
        } else if (typeof highlightId === 'number') {
          // Fallback: forcefully try deleting the dexie integer ID if record lookup failed
          syncService.deleteHighlight(null, highlightId);
        }
      }
      return newShelves;
    });
  }, []);

  const addNote = useCallback(async (bookId, noteData) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    const noteObj = typeof noteData === 'string'
      ? { text: noteData, type: 'manual_note' }
      : noteData;

    console.log('[Apex] addNote called for bookId:', targetId, '| type:', noteObj.type);

    // Save to Dexie + Supabase via syncService
    const savedNote = await syncService.saveNote(targetId, noteObj);
    if (!savedNote) return;

    // Build UI note object
    const uiNote = {
      id: savedNote.id,
      dexieId: savedNote.id,
      supabaseId: savedNote.supabaseId || null,
      text: savedNote.text,
      context: savedNote.context || null,
      type: savedNote.noteType || 'manual_note',
      noteType: savedNote.noteType || 'manual_note',
      createdAt: savedNote.createdAt,
      updatedAt: savedNote.updatedAt,
      local_id: savedNote.local_id,
    };

    // Update UI state immediately
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        if (book.id !== targetId) return book;
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            notes: [uiNote, ...(book.metadata?.notes || [])],
          },
        };
      }),
    })));
  }, []);

  const updateNote = useCallback(async (bookId, noteId, text) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    const now = new Date().toISOString();

    console.log('[Apex] updateNote called for noteId:', noteId);

    // Find the note record to get supabaseId
    const noteRecord = await db.notes.get(noteId).catch(() => null);

    // Update via syncService
    await syncService.updateNote(noteRecord?.supabaseId || null, noteId, text);

    // Update UI state immediately
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        if (book.id !== targetId) return book;
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            notes: (book.metadata?.notes || []).map(n =>
              n.id === noteId || n.dexieId === noteId
                ? { ...n, text, updatedAt: now }
                : n
            ),
          },
        };
      }),
    })));
  }, []);

  const deleteNote = useCallback(async (bookId, noteId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;

    console.log('[Apex] deleteNote called for noteId:', noteId);

    // Find the note record to get supabaseId
    const noteRecord = await db.notes.get(noteId).catch(() => null);

    // Delete via syncService (handles Dexie + Supabase)
    await syncService.deleteNote(noteRecord?.supabaseId || null, noteId);

    // Update UI state immediately
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        if (book.id !== targetId) return book;
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            notes: (book.metadata?.notes || []).filter(n =>
              n.id !== noteId && n.dexieId !== noteId
            ),
          },
        };
      }),
    })));
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
      addNote,
      updateNote,
      deleteNote,
      showDuplicateModal,
      setShowDuplicateModal,
    }}>
      {children}
    </BookContext.Provider>
  );
};
