import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "./Header";
import AllBooks from "./AllBooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContextInstance";

function HomePage({ setIsMobileOpen }) {
  const { books, addBookToShelf, handleBookClick } = useContext(BookContext);
  const navigate = useNavigate();

  const handleBookNavigate = (id) => {
    handleBookClick(id); // update timestamp
    navigate(`/reader/${id}`); // open reader
  };

  const onUpload = (file) => {
    addBookToShelf(file);
  };

  // Sort logic for "Last Read"
  const sortedByDate = [...books].sort((a, b) => {
    const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
    const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
    return dateB - dateA;
  });

  const lastReadBook = sortedByDate.length > 0 ? sortedByDate[0] : null;

  return (
    <div className="pt-4 flex flex-col gap-6 lg:gap-8">
      <TopNavBar setIsMobileOpen={setIsMobileOpen} onUpload={onUpload} />

      <Header lastReadBook={lastReadBook} />

      <AllBooks books={books} onBookClick={handleBookNavigate} />
    </div>
  )
}

export default HomePage;
