import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { shelves as initialShelves } from '../data/shelves';
import { getAllBooks, saveBook, updateBook, deleteBook } from '../utils/db';

import { BookContext } from './BookContextInstance.jsx';

export const BookProvider = ({ children }) => {
  const [shelves, setShelves] = useState(initialShelves);

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
        const storedBooks = await getAllBooks();

        if (storedBooks && Array.isArray(storedBooks) && storedBooks.length > 0) {
          setShelves(prevShelves => {
            const currentShelfNames = prevShelves.map(s => s.shelfName);
            return prevShelves.map(shelf => {
              const shelfBooks = storedBooks.filter(b => {
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
        console.error("Failed to load books from IndexedDB:", error);
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
      alert("book already there");
      return;
    }

    const newBook = {
      id: Date.now(),
      title: title,
      author: "N/A",
      progress: 0,
      currentPage: 0,
      totalPages: 1,
      status: 'new',
      shelfName: shelfName,
      lastAccessed: new Date().toISOString(),
      cover: null,
      file: fileObject,
      isLocal: true,
      metadata: {
        bookmarks: [],   // [{ page, label, addedAt }]
        highlights: [],  // reserved
        notes: [],       // reserved
      },
    };

    try {
      await saveBook(newBook);

      setShelves((prevShelves) =>
        prevShelves.map((shelf) =>
          shelf.shelfName === shelfName
            ? { ...shelf, books: [newBook, ...shelf.books] }
            : shelf
        )
      );
    } catch (error) {
      console.error("Failed to save book to IndexedDB:", error);
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
        updateBook(updatedBook).catch(err => console.error("Failed to update progress in IDB:", err));
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
        updateBook(updatedBook).catch(err => console.error('Failed to save bookmark:', err));
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
        updateBook(updatedBook).catch(err => console.error("Failed to update lastAccessed in IDB:", err));
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
        updateBook(updatedBook).catch(err => console.error("Failed to update favorite status:", err));
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
        updateBook(updatedBook).catch(err => console.error("Failed to update bookmark status:", err));
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
      deleteBook(targetId).catch(err => console.error("Failed to delete book:", err));
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
        updateBook(updatedBook).catch(err => console.error('Failed to save word:', err));
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
        updateBook(updatedBook).catch(err => console.error('Failed to remove word:', err));
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
    }}>
      {children}
    </BookContext.Provider>
  );
};
