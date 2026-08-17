import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpaceStore from '../../store/spaceStore';
import Header from "./Header";
import FeaturedSlider from "./FeaturedSlider";
import AllBooks from "./AllBooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContextInstance";
import useTour from "../../hooks/useTour";

function HomePage({ setIsMobileOpen, isAsideExpanded }) {
  const { books = [], booksLoading, addBookToShelf, handleBookClick } = useContext(BookContext) || {};
  const { setActiveSpace } = useSpaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const dashboardTourSteps = useMemo(() => [
    {
      element: '#tour-welcome',
      popover: {
        title: 'Welcome to Apex! 🚀',
        description: 'Apex is your all-in-one AI learning space. We solve the problem of fragmented study tools by bringing your books, notes, flashcards, and an AI tutor into one seamless platform.',
        side: "bottom",
        align: 'start'
      }
    },
    {
      element: '#tour-add-book',
      popover: {
        title: 'Add Your First Book',
        description: 'Start by uploading a PDF, EPUB, or DOCX. Apex will process it so you can read, highlight, and interact with the AI directly on the text.',
        side: "bottom",
        align: 'end'
      }
    },
    {
      popover: {
        title: 'Explore the Reader',
        description: 'Once you open a book, you can highlight text to ask the AI questions, define words, change colors, create flashcards, and take quizzes!',
        side: "center",
        align: 'center'
      }
    }
  ], []);

  useTour('Dashboard', dashboardTourSteps);

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
    <div className="min-h-screen flex flex-col gap-6 lg:gap-8 pt-20">
      <TopNavBar
        setIsMobileOpen={setIsMobileOpen}
        onUpload={onUpload}
        isAsideExpanded={isAsideExpanded}
      />

      {/* Only show Header and Slider when not searching */}
      {!searchQuery && (
        <div className="flex flex-col gap-2">
          <Header />
          <FeaturedSlider lastReadBook={lastReadBook} isLoading={booksLoading} />
        </div>
      )}

      <AllBooks
        books={filteredBooks}
        onBookClick={handleBookNavigate}
        isSearching={!!searchQuery}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  )
}

export default HomePage;
