import React, { createContext, useState } from 'react';
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
  const addBookToShelf = (shelfName, newBook) => {
    setShelves((prevShelves) =>
      prevShelves.map((shelf) =>
        shelf.shelfName === shelfName
          ? { ...shelf, books: [...shelf.books, { ...newBook, id: books.length + 1 }] }
          : shelf
      )
    );
  };

  /**
   * Function to update the progress of a book by its unique ID.
   * Navigates through the shelf objects to find and update the target book.
   */
  const updateBookProgress = (id, progress) => {
    setShelves((prevShelves) =>
      prevShelves.map((shelf) => ({
        ...shelf,
        books: shelf.books.map((book) =>
          book.id === id ? { ...book, progress } : book
        ),
      }))
    );
  };

  return (
    // Provide both the structured shelves and the flat list of books
    <BookContext.Provider value={{ shelves, books, addBookToShelf, updateBookProgress }}>
      {children}
    </BookContext.Provider>
  );
};
