import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "./Header";
import Allbooks from "./Allbooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContext";

function HomePage({ setIsMobileOpen }) {
  const { books, addBookToShelf, handleBookClick } = useContext(BookContext);
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  const handleBookNavigate = (id) => {
    handleBookClick(id); // update timestamp
    navigate(`/reader/${id}`); // open reader
  };

  const onUpload = (file) => {
    addBookToShelf(file);
  };

  // 1. Sort logic
  const sortedByDate = [...books].sort((a, b) => {
    const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
    const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
    return dateB - dateA;
  });

  const lastReadBook = sortedByDate.length > 0 ? sortedByDate[0] : null;

  // 2. Filter logic
  const filteredBooks = books.filter(book => {
    const status = (book.status || '').toLowerCase();
    if (activeTab === 'All') return true;
    if (activeTab === 'New') return status === 'new' || book.progress === 0;
    if (activeTab === 'Completed') return status === 'completed' || book.progress === 100;
    if (activeTab === 'Uncompleted') return status === 'uncompleted' || (book.progress > 0 && book.progress < 100);
    return true;
  });
  return (
    <div className="pt-3 h-screen flex flex-col">
      <TopNavBar setIsMobileOpen={setIsMobileOpen} onUpload={onUpload} />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastReadBook={lastReadBook}
      />

      <div className="flex-1 overflow-auto">
        <Allbooks books={filteredBooks} onBookClick={handleBookNavigate} />
      </div>
    </div>
  )
}

export default HomePage;
