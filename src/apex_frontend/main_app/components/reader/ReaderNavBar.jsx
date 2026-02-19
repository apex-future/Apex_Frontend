import React from 'react'
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
import SecondLayerNavBar from './reading_navigations/SecondLayerNavBar';

function ReaderNavBar({ book, navigate, navState, setNavState }) {
  // Called from the three-dots button.
  // stopPropagation prevents the click from also firing ReaderView's handleScreenClick.
  const handleDotsClick = (e) => {
    e.stopPropagation();
    setNavState('second');
  };

  return (
    <div className="reading-nav-bar h-full w-full relative pointer-events-none">
      {/* First layer — only when state is 'first' */}
      {navState === 'first' && (
        <FirstLayerNavBar navigate={navigate} onDotsClick={handleDotsClick} />
      )}

      {/* Second layer — only when state is 'second' */}
      <SecondLayerNavBar visible={navState === 'second'} />
    </div>
  );
}

export default ReaderNavBar