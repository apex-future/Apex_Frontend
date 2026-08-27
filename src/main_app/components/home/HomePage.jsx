import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSpaceStore from '../../store/spaceStore';
import Header from "./Header";
import FeaturedSlider from "./FeaturedSlider";
import AllBooks from "./AllBooks";
import TopNavBar from "../layout/navigation/TopNavBar";
import { BookContext } from "../../context/BookContextInstance";
import useTour from "../../hooks/useTour";
import useAuthStore from "../../store/authStore";
import useOnboardingStore from "../../store/useOnboardingStore";

function HomePage({ setIsMobileOpen, isAsideExpanded }) {
  const { books = [], booksLoading, addBookToShelf, handleBookClick } = useContext(BookContext) || {};
  const { setActiveSpace } = useSpaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const user = useAuthStore(state => state.user);
  const { hasSeenDashboardTour, dashboardTourStep, setTourStep, completeTour } = useOnboardingStore();

  const isPersonalizationDone = user && user.user_type;

  // Sort logic for "Last Read" — computed early because we also need firstBookId for the tour
  const sortedByDate = [...books].sort((a, b) => {
    const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
    const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
    return dateB - dateA;
  });
  const lastReadBook = sortedByDate.length > 0 ? sortedByDate[0] : null;
  
  // To highlight the first book after upload (it will be sorted to the top)
  const firstBookId = sortedByDate.length > 0 ? sortedByDate[0].id : null;

  const dashboardTourSteps = useMemo(() => {
    if (dashboardTourStep === 0) {
      return [
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
          element: window.innerWidth < 768 ? '#tour-add-book-mobile' : '#tour-add-book',
          popover: {
            title: 'Add Your First Book',
            description: 'Click the + button to upload a PDF, EPUB, or DOCX. Start by adding a document to read and interact with the AI.',
            side: "bottom",
            align: 'end',
            showButtons: ['close'] // Hide 'next' — user must actually click upload
          }
        }
      ];
    } else if (dashboardTourStep === 1) {
      // Step 2: The upload finished, tell them to click the book
      return [
        {
          element: firstBookId ? `#book-card-${firstBookId}` : 'body',
          popover: {
            title: 'Awesome! Now Open It 📖',
            description: 'Click on your newly uploaded book to enter the Reader Screen and continue the tour.',
            side: "bottom",
            align: 'center',
            showButtons: ['close']
          }
        }
      ];
    }
    return [];
  }, [dashboardTourStep, firstBookId]);

  // Only auto-start the dashboard tour when: personalization is done AND not already seen
  const shouldStartDashboardTour = !!isPersonalizationDone && !hasSeenDashboardTour && dashboardTourSteps.length > 0;
  useTour('Dashboard', dashboardTourSteps, shouldStartDashboardTour);

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

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(book =>
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

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
