import React, { createContext, useState, useCallback, useEffect } from 'react';
// Import the restructured shelves data
import { shelves as initialShelves } from '../data/shelves';
import { getAllBooks, saveBook, updateBook } from '../utils/db';

// Create a Context object to provide data to the rest of the application
export const BookContext = createContext();

/**
 * BookProvider:
 * Manages the global state for books organized into named shelves.
 */
export const BookProvider = ({ children }) => {
  // State for the array of shelf objects
  const [shelves, setShelves] = useState(initialShelves);

  // Derived state: Flatten all shelf.books arrays into a single list.
  const books = shelves.flatMap((shelf) => shelf.books);

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await getAllBooks();
        if (storedBooks && storedBooks.length > 0) {
          // Reconstruct shelves with stored books
          setShelves(prevShelves => 
            prevShelves.map(shelf => {
              // Filter stored books that belong to this shelf name (defaulting to 'Active Reading' if not found)
              // Note: We might want to store shelfName in the book object itself for better tracking
              const shelfBooks = storedBooks.filter(b => b.shelfName === shelf.shelfName);
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

  /**
   * Function to add a book to a specific shelf.
   */
  const addBookToShelf = useCallback(async (fileObject, shelfName = 'Active Reading') => {
    const newBook = {
      id: Date.now(),
      title: fileObject.name || "New Document",
      author: "Uploaded User",
      progress: 0,
      currentPage: 0,
      totalPages: 1, // Default
      status: 'new',
      shelfName: shelfName, // Store shelf association
      lastAccessed: new Date().toISOString(),
      cover: null, // Default cover
      file: fileObject, // STORE THE ACTUAL FILE!
      isLocal: true
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
  }, []);

  /**
   * Function to update the progress of a book by its unique ID.
   */
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

  /**
   * Function to update the last accessed timestamp of a book.
   */
  const handleBookClick = useCallback((id) => {
    setShelves((prevShelves) => {
      let updatedBook = null;
      const newShelves = prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) => {
          if (book.id === parseInt(id)) {
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
    // Provide both the structured shelves and the flat list of books
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
