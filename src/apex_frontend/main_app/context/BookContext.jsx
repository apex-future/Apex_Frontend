import React, { createContext, useState } from 'react';
import { books as initialBooks } from '../data/books';

export const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(initialBooks);

  const addBook = (newBook) => {
    setBooks((prevBooks) => [...prevBooks, { ...newBook, id: prevBooks.length + 1 }]);
  };

  const updateBookProgress = (id, progress) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === id ? { ...book, progress } : book))
    );
  };

  return (
    <BookContext.Provider value={{ books, addBook, updateBookProgress }}>
      {children}
    </BookContext.Provider>
  );
};
