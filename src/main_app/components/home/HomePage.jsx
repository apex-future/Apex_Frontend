import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpaceStore from '../../store/spaceStore';
import Header from "./Header";
import FeaturedSlider from "./FeaturedSlider";
import AllBooks from "./AllBooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContextInstance";

function HomePage({ setIsMobileOpen }) {
  const { books, addBookToShelf, handleBookClick } = useContext(BookContext);
  const { setActiveSpace } = useSpaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setActiveSpace(null);
  }, [setActiveSpace]);

  const handleBookNavigate = (id) => {
    handleBookClick(id); // update timestamp
    navigate(`/reader/${id}`); // open reader
  };

  const onUpload = (file) => {
    addBookToShelf(file);
  };

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(book =>
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  // Sort logic for "Last Read"
  const sortedByDate = [...books].sort((a, b) => {
    const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
    const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
    return dateB - dateA;
  });

  const lastReadBook = sortedByDate.length > 0 ? sortedByDate[0] : null;

  return (
    <div className="min-h-screen pt-4 flex flex-col gap-6 lg:gap-8">
      <TopNavBar
        setIsMobileOpen={setIsMobileOpen}
        onUpload={onUpload}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Only show Header and Slider when not searching */}
      {!searchQuery && (
        <>
          <Header />
          <FeaturedSlider lastReadBook={lastReadBook} />
        </>
      )}

      <AllBooks
        books={filteredBooks}
        onBookClick={handleBookNavigate}
        isSearching={!!searchQuery}
      />
    </div>
  )
}

export default HomePage;
