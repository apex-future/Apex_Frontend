import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { shelves as initialShelves } from '../data/shelves';
import { getAllBooks, saveBook, updateBook } from '../utils/db';

export const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [shelves, setShelves] = useState(initialShelves);

  // Directly calculate books instead of complex memo to ensure zero delay in reactivity
  const books = (shelves || []).flatMap((shelf) => shelf.books || []);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await getAllBooks();
        console.log("Loaded books from DB:", storedBooks?.length);

        if (storedBooks && Array.isArray(storedBooks) && storedBooks.length > 0) {
          setShelves(prevShelves =>
            prevShelves.map(shelf => {
              const shelfBooks = storedBooks.filter(b => {
                if (shelf.shelfName === 'Active Reading') {
                  return b.shelfName === shelf.shelfName || !b.shelfName;
                }
                return b.shelfName === shelf.shelfName;
              });
              return { ...shelf, books: shelfBooks };
            })
          );
        }
      } catch (error) {
        console.error("Failed to load books from IndexedDB:", error);
      }
    };
    loadBooks();
  }, []);

  const addBookToShelf = useCallback(async (fileObject, shelfName = 'Active Reading') => {
    if (!fileObject) return;

    const newBook = {
      id: Date.now(),
      title: fileObject.name || "New Document",
      author: "Uploaded User",
      progress: 0,
      currentPage: 0,
      totalPages: 1,
      status: 'new',
      shelfName: shelfName,
      lastAccessed: new Date().toISOString(),
      cover: null,
      file: fileObject,
      isLocal: true
    };

    try {
      await saveBook(newBook);
      console.log("Saved new book:", newBook.title);

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
  }, []);

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

  return (
    <BookContext.Provider value={{
      shelves,
      books,
      addBookToShelf,
      updateBookProgress,
      handleBookClick
    }}>
      {children}
    </BookContext.Provider>
  );
};
