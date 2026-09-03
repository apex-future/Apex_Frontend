import React, { useState, useCallback, useEffect, useMemo } from 'react';
import db from '../db/apex.db';
import syncService from '../services/syncService';
import { showToastGlobal } from '../hooks/useToast';
import { BookContext } from './BookContextInstance.jsx';
import useSpaceStore from '../store/spaceStore';
import useQuestStore from '../store/useQuestStore';
import { pdfjs } from 'react-pdf';
import { isValidAuthor, cleanAuthor, extractAuthorFromFilename } from '../utils/documentMetadata';

export const BookProvider = ({ children }) => {
  const { spaces, addBookToSpace, removeBookFromSpace } = useSpaceStore();
  const [allBooks, setAllBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const shelves = useMemo(() => {
    const currentSpaceNames = spaces.map(s => s.name);
    return spaces.map(space => {
      const spaceBooks = allBooks.filter(b => {
        if (space.id === 'favorites') return b.isFavorite;
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

  const loadBooks = useCallback(async () => {
    try {
      const storedBooks = await db.books.toArray();

      if (storedBooks && Array.isArray(storedBooks) && storedBooks.length > 0) {
        // Reconstruct File objects from stored ArrayBuffers
        const hydratedBooks = storedBooks.map(b => {
          if (b.fileBlob && !b.file) {
            let fileType = b.fileType;
            const titleLower = b.title?.toLowerCase() || '';

            // Check magic bytes directly on ArrayBuffer if available
            let isZipMagic = false;
            let isPdfMagic = false;
            if (b.fileBlob instanceof ArrayBuffer && b.fileBlob.byteLength >= 4) {
              const bytes = new Uint8Array(b.fileBlob, 0, 4);
              isZipMagic = bytes[0] === 0x50 && bytes[1] === 0x4B;
              isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
            }

            if (titleLower.endsWith('.epub') || fileType?.includes('epub') || (isZipMagic && !titleLower.endsWith('.docx'))) {
              fileType = 'application/epub+zip';
            } else if (titleLower.endsWith('.docx') || fileType?.includes('wordprocessingml') || (isZipMagic && titleLower.endsWith('.docx'))) {
              fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (titleLower.endsWith('.doc') || fileType === 'application/msword') {
              fileType = 'application/msword';
            } else if (titleLower.endsWith('.txt') || fileType === 'text/plain') {
              fileType = 'text/plain';
            } else if (isPdfMagic || titleLower.endsWith('.pdf')) {
              fileType = 'application/pdf';
            }

            // If Dexie had misclassified this as a PDF, correct it asynchronously
            if (fileType && b.id && b.fileType !== fileType) {
              db.books.update(b.id, { fileType }).catch(() => {});
            }

            const fileExt = fileType === 'application/epub+zip' ? '.epub' :
              fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx' :
                fileType === 'application/msword' ? '.doc' :
                  fileType === 'text/plain' ? '.txt' :
                    '.pdf';
            const cleanTitle = b.title ? b.title.replace(/\.(epub|pdf|docx|doc|txt)$/i, '') : 'Untitled';
            const file = new File([b.fileBlob], cleanTitle + fileExt, { type: fileType || 'application/pdf' });
            return { ...b, fileType, file };
          }
          return b;
        });

        // Load reading progress — match by Dexie integer ID, Supabase UUID, and local_id
        const progressRecords = await db.reading_progress.toArray();
        const progressMap = {};
        for (const p of progressRecords) {
          const key = p.bookId; // Could be integer (local) or UUID (pulled)
          if (!progressMap[key] || new Date(p.lastReadAt) > new Date(progressMap[key].lastReadAt)) {
            progressMap[key] = p;
          }
          if (p.supabaseId) {
            if (!progressMap[p.supabaseId] || new Date(p.lastReadAt) > new Date(progressMap[p.supabaseId].lastReadAt)) {
              progressMap[p.supabaseId] = p;
            }
          }
          if (p.local_id) {
            if (!progressMap[p.local_id] || new Date(p.lastReadAt) > new Date(progressMap[p.local_id].lastReadAt)) {
              progressMap[p.local_id] = p;
            }
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

        // Load tabs from Dexie tabs table
        // Tabs are stored by bookId (integer OR supabaseId string)
        const allTabs = await db.tabs.toArray();
        const tabsByBook = {};
        for (const n of allTabs) {
          const key = n.bookId;
          if (!tabsByBook[key]) tabsByBook[key] = [];
          tabsByBook[key].push({
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
          // Match by Dexie integer id OR Supabase UUID OR local_id
          const progress = progressMap[b.id] || (b.supabaseId && progressMap[b.supabaseId]) || (b.local_id && progressMap[b.local_id]);

          // Merge highlights: combine metadata-stored + Dexie table highlights
          const metadataHighlights = b.metadata?.highlights || [];
          const tableHighlights = highlightsByBook[b.id] || (b.supabaseId && highlightsByBook[b.supabaseId]) || [];
          // Deduplicate: if a highlight exists in both, prefer the table version
          const existingTexts = new Set(tableHighlights.map(h => h.highlightedText?.toLowerCase()));
          const uniqueMetaHighlights = metadataHighlights.filter(
            h => !existingTexts.has((h.text || h.highlightedText || '').toLowerCase())
          );
          const mergedHighlights = [...tableHighlights, ...uniqueMetaHighlights];

          // Merge bookmarks
          const metadataBookmarks = b.metadata?.bookmarks || [];
          const tableBookmarks = bookmarksByBook[b.id] || (b.supabaseId && bookmarksByBook[b.supabaseId]) || [];
          const existingPages = new Set(tableBookmarks.map(bm => bm.page));
          const uniqueMetaBookmarks = metadataBookmarks.filter(bm => !existingPages.has(bm.page));
          const mergedBookmarks = [...tableBookmarks, ...uniqueMetaBookmarks].sort((a, c) => a.page - c.page);

          // Merge tabs from Dexie tabs table
          const tableTabs = tabsByBook[b.id] || (b.supabaseId && tabsByBook[b.supabaseId]) || (b.local_id && tabsByBook[b.local_id]) || (tabsByBook[String(b.id)]) || [];

          // Compute progress from currentPage / totalPages — single source of truth
          // Never trust stored progress_percentage — it gets corrupted
          const currentPage = progress?.currentPage || b.currentPage || 0;
          const totalPages = b.totalPages || progress?.totalPages || 1;
          const computedProgress = totalPages > 1 && currentPage > 0
            ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
            : (progress?.progressPercentage || b.progress || 0);

          return {
            ...b,
            isUploading: false,
            progress: computedProgress,
            currentPage: currentPage || 1,
            totalPages: totalPages,
            scrollPosition: progress?.scrollPosition || b.scrollPosition || 0,
            metadata: {
              ...(b.metadata || {}),
              highlights: mergedHighlights,
              bookmarks: mergedBookmarks,
              tabs: tableTabs, // ← from Dexie tabs table, not metadata
            },
          };
        });

        setAllBooks(booksWithProgress);
      } else {
        setAllBooks([]);
      }
    } catch (error) {
      console.error("Failed to load books from Dexie:", error);
    } finally {
      setBooksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();

    const handleSyncComplete = (e) => {
      if (import.meta.env.DEV) console.log('[Apex Context] Sync complete event received — reloading books & reading progress', e?.detail);
      loadBooks();
    };

    window.addEventListener('apex:sync-complete', handleSyncComplete);
    window.addEventListener('apex:books-updated', handleSyncComplete);

    return () => {
      window.removeEventListener('apex:sync-complete', handleSyncComplete);
      window.removeEventListener('apex:books-updated', handleSyncComplete);
    };
  }, [loadBooks]);

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
    const fileNameLower = fileObject.name?.toLowerCase() || '';

    // Detect format from extension and magic bytes
    let fileType = fileObject.type;
    let isZipMagic = false;
    let isPdfMagic = false;
    if (arrayBuffer && arrayBuffer.byteLength >= 4) {
      const bytes = new Uint8Array(arrayBuffer, 0, 4);
      isZipMagic = bytes[0] === 0x50 && bytes[1] === 0x4B;
      isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    }

    if (fileNameLower.endsWith('.epub') || fileType?.includes('epub') || (isZipMagic && !fileNameLower.endsWith('.docx'))) {
      fileType = 'application/epub+zip';
    } else if (fileNameLower.endsWith('.docx') || fileType?.includes('wordprocessingml') || (isZipMagic && fileNameLower.endsWith('.docx'))) {
      fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileNameLower.endsWith('.doc') || fileType === 'application/msword') {
      fileType = 'application/msword';
    } else if (fileNameLower.endsWith('.txt') || fileType === 'text/plain') {
      fileType = 'text/plain';
    } else if (isPdfMagic || fileNameLower.endsWith('.pdf') || fileType === 'application/pdf') {
      fileType = 'application/pdf';
    } else {
      fileType = fileType || 'application/pdf';
    }

    // Extract total page count and author from PDF at upload time
    let extractedPageCount = 0;
    let extractedAuthor = null;
    const isPdf = fileType === 'application/pdf' && !fileNameLower.endsWith('.epub');
    if (isPdf) {
      try {
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
        extractedPageCount = pdfDoc.numPages;
        const meta = await pdfDoc.getMetadata().catch(() => null);
        if (meta?.info?.Author) {
          extractedAuthor = cleanAuthor(meta.info.Author);
        }
        console.log('[Apex] Extracted PDF metadata — pages:', extractedPageCount, 'author:', extractedAuthor);
      } catch (err) {
        console.warn('[Apex] Failed to extract metadata from PDF:', err);
      }
    }

    // Heuristic filename author extraction if not discovered in PDF metadata
    if (!extractedAuthor && fileObject.name) {
      extractedAuthor = extractAuthorFromFilename(fileObject.name);
    }

    const newBookData = {
      title,
      author: extractedAuthor || null,
      fileType,
      fileSize: fileObject.size,
      fileBlob: arrayBuffer,
      coverImage: null,
      totalPages: extractedPageCount || 1,
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
      isUploading: false,
      metadata: {
        bookmarks: [],
        highlights: [],
        tabs: [],
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

    // Step 2: Add to UI immediately — BEFORE background upload
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
    useQuestStore.getState().reportAction('book_uploaded', 1);

    // Concise toast informing user they can read immediately
    showToastGlobal('Uploading your book, but you can start reading.', 'info', 4000);

    // Step 3: Reconstruct fresh File from ArrayBuffer and upload in background
    const freshBlob = new Blob([arrayBuffer], { type: fileType });
    const freshFile = new File([freshBlob], fileObject.name, { type: fileType });

    if (navigator.onLine) {
      try {
        console.log('[Apex] Starting background upload for:', title);
        const result = await syncService.uploadBook(freshFile, title, 'Unknown', id);

        if (result) {
          console.log('[Apex] Upload successful for:', title, '| supabaseId:', result.id);

          // Update book in UI with supabaseId and sync_status
          setShelves(prev => prev.map(shelf => ({
            ...shelf,
            books: shelf.books.map(b =>
              b.id === id ? { ...b, supabaseId: result.id, sync_status: 'synced' } : b
            ),
          })));

          // Minimal success toast when background sync completes
          showToastGlobal('Book synced to cloud successfully.', 'success', 3000);
        } else {
          console.error('[Apex] Upload returned null for:', title);

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

          showToastGlobal('Book saved offline. It will sync when your connection is stable.', 'warning', 4000);
        }
      } catch (uploadErr) {
        console.error('[Apex] Upload exception for:', title, uploadErr);
        showToastGlobal('Book saved offline. It will sync when your connection is stable.', 'warning', 4000);
      }
    } else {
      // Offline — queue for later
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

  const updateBookProgress = useCallback(async (id, progress, currentPage, totalPages, scrollPosition = 0) => {
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === id) {
            updatedBook = { ...book, progress, currentPage, totalPages, scrollPosition };
            return updatedBook;
          }
          return book;
        }),
      }));

      if (updatedBook) {
        const now = new Date().toISOString();
        // Update in Dexie books table
        db.books.update(id, { progress, currentPage, totalPages, scrollPosition, lastReadAt: now })
          .catch(err => console.error("Failed to update progress in Dexie:", err));

        // Use direct save via syncService (this is debounced inside syncService)
        // Pass supabaseId directly — after pull sync, Dexie IDs change but React
        // state keeps old IDs, so _resolveBookId(oldDexieId) fails. Passing
        // the supabaseId we already have bypasses the broken Dexie lookup.
        // Send total_pages so progress can be computed from current_page / total_pages
        if (syncService.saveProgress) {
          syncService.saveProgress(id, {
            current_page: currentPage,
            scroll_position: scrollPosition,
            total_pages: totalPages || 1,
            _supabase_book_id: updatedBook.supabaseId || null,
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
          syncService.saveBookmark(bookId, { page_number: page, label: `Page ${page}`, _supabase_book_id: updatedBook?.supabaseId || null });
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
      // Use setAllBooks directly — setShelves re-adds missing books from prevBooks,
      // which completely negates the delete. setAllBooks bypasses the shelf adapter.
      setAllBooks(prev => prev.filter(b => b.id !== targetId));

      // Step 3: Show toast immediately — before any async Dexie/Supabase work
      showToastGlobal('Book deleted.', 'success');

      if (!bookRecord) {
        console.warn('[Apex] No book record found anywhere for id:', targetId);
        return;
      }

      // Step 4: Delete related records from Dexie by BOTH integer ID and supabaseId
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

      // Tabs
      const tabsByInt = await db.tabs.where('bookId').equals(targetId).toArray();
      const tabsByUuid = bookRecord.supabaseId
        ? await db.tabs.where('bookId').equals(bookRecord.supabaseId).toArray()
        : [];
      const allTabIds = [...tabsByInt, ...tabsByUuid].map(n => n.id);
      if (allTabIds.length > 0) {
        await db.tabs.bulkDelete(allTabIds);
        console.log('[Apex] Deleted tabs:', allTabIds.length);
      }

      // Also try deleting by supabaseId directly in case Dexie integer lookup missed it
      if (bookRecord.supabaseId) {
        try {
          const bookByUuid = await db.books
            .where('supabaseId').equals(bookRecord.supabaseId)
            .first();
          if (bookByUuid && bookByUuid.id !== targetId) {
            console.log('[Apex] Found book by supabaseId with different Dexie id:', bookByUuid.id);
            await db.books.delete(bookByUuid.id);
          }
        } catch (err) {
          console.warn('[Apex] supabaseId lookup failed:', err);
        }
      }

      // Delete the book by integer id
      await db.books.delete(targetId).catch(() => { });
      console.log('[Apex] Dexie delete complete for bookId:', targetId);

      // Step 5: Delete from Supabase directly (not via sync queue)
      // This matches the pattern used by deleteHighlight/deleteBookmark/deleteNote
      if (bookRecord.supabaseId) {
        console.log('[Apex] Deleting from Supabase for supabaseId:', bookRecord.supabaseId);
        syncService.deleteBook(bookRecord.supabaseId);
      } else {
        console.log('[Apex] Book was local only — no Supabase delete needed');
      }

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
          
          // If we already have the exact word on the SAME page and offset, don't duplicate
          if (existingWords.some(w => 
             w.word.toLowerCase() === wordObj.word.toLowerCase() && 
             w.pageNumber === wordObj.pageNumber && 
             w.startOffset === wordObj.startOffset
          )) {
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
    let bookSupabaseId = null;

    // Update UI state immediately
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          bookSupabaseId = book.supabaseId || null;
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
        _supabase_book_id: bookSupabaseId,
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

  const addTab = useCallback(async (bookId, tabData) => {
    const targetId = !isNaN(Number(bookId)) && Number(bookId) !== 0 ? Number(bookId) : bookId;
    const tabObj = typeof tabData === 'string'
      ? { text: tabData, type: 'manual_note' }
      : tabData;

    console.log('[Apex] addTab called for bookId:', targetId, '| type:', tabObj.type);

    const tempId = Date.now();

    // Build optimistic UI tab object
    const optimisticUiTab = {
      id: tempId,
      dexieId: tempId,
      supabaseId: null,
      text: tabObj.text,
      context: tabObj.context || null,
      type: tabObj.type || 'manual_note',
      startOffset: tabObj.startOffset,
      pageNumber: tabObj.pageNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      local_id: tempId,
    };

    // Update UI state immediately (optimistic)
    let bookSupabaseId = null;
    let alreadyExists = false;
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        const matchesBook = book.id === targetId || String(book.id) === String(targetId) || book.supabaseId === targetId || book.local_id === String(targetId);
        if (!matchesBook) return book;
        bookSupabaseId = book.supabaseId || null;
        const existingTabs = book.metadata?.tabs || [];
        // Deduplicate: don't add a second tab for the same exact text position
        if (tabObj.startOffset != null && tabObj.pageNumber != null) {
          const dup = existingTabs.find(
            t => t.startOffset === tabObj.startOffset && t.pageNumber === tabObj.pageNumber
          );
          if (dup) { alreadyExists = true; return book; }
        }
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            tabs: [optimisticUiTab, ...existingTabs],
          },
        };
      }),
    })));

    if (alreadyExists) {
      console.log('[Apex] addTab: duplicate startOffset+pageNumber, skipping.');
      return;
    }

    // Save to Dexie + Supabase via syncService
    try {
      const savedTab = await syncService.saveTab(targetId, { ...tabObj, _supabase_book_id: bookSupabaseId });
      if (!savedTab) return;

      // Patch the in-memory tab with the real Dexie ID + supabaseId
      setShelves(prev => prev.map(shelf => ({
        ...shelf,
        books: shelf.books.map(book => {
          if (book.id !== targetId) return book;
          return {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              tabs: (book.metadata?.tabs || []).map(t =>
                t.id === tempId
                  ? {
                      ...t,
                      id: savedTab.id,
                      dexieId: savedTab.id,
                      supabaseId: savedTab.supabaseId || null,
                      local_id: savedTab.local_id,
                      createdAt: savedTab.createdAt,
                      updatedAt: savedTab.updatedAt,
                    }
                  : t
              ),
            },
          };
        }),
      })));
      return { id: savedTab.id };
    } catch (err) {
      console.error('[Apex] Failed to save tab via syncService:', err);
    }
  }, [books]);

  const updateTab = useCallback(async (bookId, tabId, text) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    const now = new Date().toISOString();

    console.log('[Apex] updateTab called for tabId:', tabId);

    // Find the tab record to get supabaseId
    const tabRecord = await db.tabs.get(tabId).catch(() => null);

    // Update via syncService
    await syncService.updateTab(tabRecord?.supabaseId || null, tabId, text);

    // Update UI state immediately
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        if (book.id !== targetId) return book;
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            tabs: (book.metadata?.tabs || []).map(n =>
              n.id === tabId || n.dexieId === tabId
                ? { ...n, text, updatedAt: now }
                : n
            ),
          },
        };
      }),
    })));
  }, []);

  const deleteTab = useCallback(async (bookId, tabId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;

    console.log('[Apex] deleteTab called for tabId:', tabId);

    // Find the tab record to get supabaseId
    const tabRecord = await db.tabs.get(tabId).catch(() => null);

    // Delete via syncService (handles Dexie + Supabase)
    await syncService.deleteTab(tabRecord?.supabaseId || null, tabId);

    // Update UI state immediately
    setShelves(prev => prev.map(shelf => ({
      ...shelf,
      books: shelf.books.map(book => {
        if (book.id !== targetId) return book;
        return {
          ...book,
          metadata: {
            ...(book.metadata || {}),
            tabs: (book.metadata?.tabs || []).filter(n =>
              n.id !== tabId && n.dexieId !== tabId
            ),
          },
        };
      }),
    })));
  }, []);

  const addSimplification = useCallback(async (bookId, simplification) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    const simplificationId = Date.now();

    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existing = book.metadata?.simplifications || [];
          // Deduplicate by original text (case-insensitive)
          if (existing.some(s => s.originalText?.toLowerCase() === simplification.originalText?.toLowerCase())) {
            return book;
          }
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              simplifications: [...existing, { ...simplification, id: simplificationId }],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save simplification metadata:', err));
      }
      return newShelves;
    });

    return simplificationId;
  }, []);

  const removeSimplification = useCallback(async (bookId, simplificationId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;

    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existing = book.metadata?.simplifications || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              simplifications: existing.filter(s => s.id !== simplificationId),
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to remove simplification metadata:', err));
      }
      return newShelves;
    });
  }, []);

  return (
    <BookContext.Provider value={{
      shelves,
      books,
      booksLoading,
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
      addTab,
      updateTab,
      deleteTab,
      addSimplification,
      removeSimplification,
      showDuplicateModal,
      setShowDuplicateModal,
      reloadBooks: loadBooks,
    }}>
      {children}
    </BookContext.Provider>
  );
};
