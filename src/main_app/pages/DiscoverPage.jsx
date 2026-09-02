import React from 'react';
import { 
  Binoculars, 
  Books, 
  Sparkle, 
  FileArrowDown, 
  GlobeSimple,
  Bookmarks
} from '@phosphor-icons/react';
import ComingSoon from '../components/ui/ComingSoon';

/**
 * DiscoverPage Component
 * 
 * E-Library and book discovery feature page.
 * Reached via the binocular icon in the bottom navigation bar and desktop sidebar.
 */
export default function DiscoverPage() {
  const highlights = [
    {
      icon: Books,
      title: 'Boundless Open Library',
      description: 'Explore thousands of public-domain classics, open-access textbooks, and academic papers ready to read anytime.',
    },
    {
      icon: Sparkle,
      title: 'Cleo Smart Recommendations',
      description: 'Get tailored reading suggestions based on your study history, active quests, and current knowledge goals.',
    },
    {
      icon: FileArrowDown,
      title: 'One-Tap Shelf Import',
      description: 'Add any book straight to your personal shelf. Reads flawlessly in Apex EPUB & PDF readers with auto-synced flashcards.',
    },
    {
      icon: GlobeSimple,
      title: 'Community Spaces & Picks',
      description: 'Discover popular reading spaces, top annotations, and study recommendations shared by fellow scholars.',
    },
  ];

  return (
    <ComingSoon
      icon={Binoculars}
      badge="E-Library • Coming Soon"
      badgeIcon={Bookmarks}
      title="Discover New Reads & E-Library"
      description="An immersive e-library where you can explore curated literature, discover academic gems, and expand your bookshelf with seamless one-click imports."
      highlights={highlights}
    />
  );
}
