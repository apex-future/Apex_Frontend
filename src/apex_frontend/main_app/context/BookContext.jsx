import React, { createContext, useState, useCallback } from 'react';
// Import the restructured shelves data
import { shelves as initialShelves } from '../data/shelves';

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
  // This allows components like Allbooks to continue working with a simple array.
  const books = shelves.flatMap((shelf) => shelf.books);

  /**
   * Function to add a book to a specific shelf.
   * Finds the shelf by name and appends the new book to its array.
   */
  const addBookToShelf = useCallback((fileObject, shelfName = 'Active Reading') => {
    const newBook = {
      id: Date.now(),
      title: fileObject.name || "New Document",
      author: "Uploaded User",
      progress: 0,
      currentPage: 0,
      totalPages: 1, // Default
      status: 'new',
      lastAccessed: new Date().toISOString(),
      cover: null, // Default cover
      file: fileObject, // STORE THE ACTUAL FILE!
      isLocal: true
    };

    setShelves((prevShelves) =>
      prevShelves.map((shelf) =>
        shelf.shelfName === shelfName
          ? { ...shelf, books: [newBook, ...shelf.books] }
          : shelf
      )
    );
  }, []);

  /**
   * Function to update the progress of a book by its unique ID.
   * Navigates through the shelf objects to find and update the target book.
   */
  const updateBookProgress = useCallback((id, progress, currentPage, totalPages) => {
    setShelves((prevShelves) =>
      prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) =>
          book.id === id ? { ...book, progress, currentPage, totalPages } : book
        ),
      }))
    );
  }, []);

  /**
   * Function to update the last accessed timestamp of a book.
   */
  const handleBookClick = useCallback((id) => {
    setShelves((prevShelves) =>
      prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) =>
          book.id === parseInt(id) ? { ...book, lastAccessed: new Date().toISOString() } : book
        ),
      }))
    );
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
