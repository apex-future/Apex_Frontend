import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpaceStore from '../../store/spaceStore';
import Header from "./Header";
import FeaturedSlider from "./FeaturedSlider";
import AllBooks from "./AllBooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContextInstance";
import DashboardTour from "./DashboardTour";
import useAuthStore from "../../store/authStore";
import useOnboardingStore from "../../store/useOnboardingStore";

function HomePage({ setIsMobileOpen, isAsideExpanded }) {
  const { books = [], booksLoading, addBookToShelf, handleBookClick } = useContext(BookContext) || {};
  const { setActiveSpace } = useSpaceStore();
  const navigate = useNavigate();

  const user = useAuthStore(state => state.user);
  const { hasSeenDashboardTour, completeTour } = useOnboardingStore();

  const isPersonalizationDone = user ? Boolean(user.user_type) : true;

  // Sort logic for "Last Read" — computed early because we also need firstBookId for the tour
  const sortedByDate = [...books].sort((a, b) => {
    const getBookRecentTime = (book) => {
      if (!book) return 0;
      const times = [
        book.lastAccessed,
        book.lastReadAt,
        book.last_read_at,
        book.uploadedAt,
        book.uploaded_at
      ]
        .filter(Boolean)
        .map(d => new Date(d).getTime())
        .filter(t => !isNaN(t) && t > 0);
      return times.length > 0 ? Math.max(...times) : 0;
    };
    const dateA = getBookRecentTime(a);
    const dateB = getBookRecentTime(b);
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });
  const lastReadBook = sortedByDate.length > 0 ? sortedByDate[0] : null;
  
  // To highlight the first book after upload (it will be sorted to the top)
  const firstBookId = sortedByDate.length > 0 ? sortedByDate[0].id : null;

  useEffect(() => {
    setActiveSpace(null);
  }, [setActiveSpace]);

  const handleBookNavigate = (id) => {
    handleBookClick(id);
    
    // Complete dashboard tour if they navigate to the reader
    if (isPersonalizationDone && !hasSeenDashboardTour) {
        completeTour('Dashboard');
    }
    
    navigate(`/reader/${id}`);
  };

  const onUpload = async (file) => {
    try {
        await addBookToShelf(file);
        // Upload successful, advance tour to "click the book" step
        if (dashboardTourStep === 0 && isPersonalizationDone && !hasSeenDashboardTour) {
            setTourStep('Dashboard', 1);
        }
    } catch (err) {
        // Handle error normally, don't advance tour
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 lg:gap-8 pt-20">
      <TopNavBar
        setIsMobileOpen={setIsMobileOpen}
        onUpload={onUpload}
        isAsideExpanded={isAsideExpanded}
      />

      <div className="flex flex-col gap-2">
        <Header />
        <FeaturedSlider lastReadBook={lastReadBook} isLoading={booksLoading} />
      </div>

      <AllBooks
        books={books}
        onBookClick={handleBookNavigate}
      />

      <DashboardTour
        isPersonalizationDone={isPersonalizationDone}
        books={books}
        firstBookId={firstBookId}
        isLoading={booksLoading}
      />
    </div>
  )
}

export default HomePage;
