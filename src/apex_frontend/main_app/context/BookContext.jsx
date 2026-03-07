import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { shelves as initialShelves } from '../data/shelves';
import db from '../../../db/apex.db';

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

          // Also load reading progress for each book
          const progressRecords = await db.reading_progress.toArray();
          const progressMap = {};
          for (const p of progressRecords) {
            if (!progressMap[p.bookId] || new Date(p.lastReadAt) > new Date(progressMap[p.bookId].lastReadAt)) {
              progressMap[p.bookId] = p;
            }
          }

          const booksWithProgress = hydratedBooks.map(b => {
            const progress = progressMap[b.id];
            if (progress) {
              return {
                ...b,
                progress: progress.progressPercentage || b.progress || 0,
                currentPage: progress.currentPage || b.currentPage || 1,
              };
            }
            return b;
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

      // Add to sync_queue with local_id
      await db.sync_queue.add({
        action: 'upload',
        tableName: 'books',
        local_id: id.toString(),
        payload: {
          title,
          author: "Unknown",
          fileType,
          fileSize: fileObject.size,
          uploadedAt: newBookData.uploadedAt
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending'
      });

      // Trigger immediate sync attempt
      import('../../../services/syncService').then(m => m.default.triggerSync?.());

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
        // Update in Dexie books table
        db.books.update(id, { progress, currentPage, totalPages, lastReadAt: new Date().toISOString() })
          .catch(err => console.error("Failed to update progress in Dexie:", err));

        // Also save to reading_progress table (upsert by bookId)
        db.reading_progress.where('bookId').equals(id).first().then(existing => {
          const progressData = {
            bookId: id,
            currentPage,
            scrollPosition: 0,
            progressPercentage: progress,
            lastReadAt: new Date().toISOString(),
          };
          if (existing) {
            db.reading_progress.update(existing.id, progressData);
          } else {
            db.reading_progress.add(progressData);
          }
        }).catch(err => console.error("Failed to save reading progress:", err));
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
          .catch(err => console.error('Failed to save bookmark:', err));
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
          .catch(err => console.error("Failed to update bookmark status:", err));
      }
      return newShelves;
    });
  }, []);

  const deleteBookFromShelves = useCallback(async (id) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    setShelves((prevShelves) => {
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.filter((book) => book.id !== targetId),
      }));
      // Delete from Dexie
      db.books.delete(targetId).catch(err => console.error("Failed to delete book:", err));
      // Also clean up related progress and highlights
      db.reading_progress.where('bookId').equals(targetId).delete().catch(() => { });
      db.highlights.where('bookId').equals(targetId).delete().catch(() => { });
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
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingHighlights = book.metadata?.highlights || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              highlights: [...existingHighlights, { ...highlight, id: Date.now() }],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to save highlight:', err));
      }
      return newShelves;
    });
  }, []);

  const removeHighlight = useCallback(async (bookId, highlightId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
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
          .catch(err => console.error('Failed to remove highlight:', err));
      }
      return newShelves;
    });
  }, []);

  const addNote = useCallback(async (bookId, text) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingNotes = book.metadata?.notes || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              notes: [{ id: Date.now().toString(), text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...existingNotes],
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to add note:', err));
      }
      return newShelves;
    });
  }, []);

  const updateNote = useCallback(async (bookId, noteId, text) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingNotes = book.metadata?.notes || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              notes: existingNotes.map(n => n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n),
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to update note:', err));
      }
      return newShelves;
    });
  }, []);

  const deleteNote = useCallback(async (bookId, noteId) => {
    const targetId = typeof bookId === 'string' ? parseInt(bookId) : bookId;
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id !== targetId) return book;
          const existingNotes = book.metadata?.notes || [];
          updatedBook = {
            ...book,
            metadata: {
              ...(book.metadata || {}),
              notes: existingNotes.filter(n => n.id !== noteId),
            },
          };
          return updatedBook;
        }),
      }));
      if (updatedBook) {
        db.books.update(targetId, { metadata: updatedBook.metadata })
          .catch(err => console.error('Failed to delete note:', err));
      }
      return newShelves;
    });
  }, []);

  return (
    <BookContext.Provider value={{
      shelves,
      books,
      addBookToShelf,
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
