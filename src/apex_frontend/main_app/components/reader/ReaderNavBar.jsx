import React from 'react'
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
import SecondLayerNavBar from './reading_navigations/SecondLayerNavBar';

function ReaderNavBar({ book, navigate, navState, setNavState, aiModal, setAiModal, leftPanel, setLeftPanel }) {
  const handleDotsClick = (e) => {
    e.stopPropagation();
    setNavState('second');
  };

  return (
    <div className="reading-nav-bar h-full w-full relative pointer-events-none">
      {navState === 'first' && (
        <FirstLayerNavBar navigate={navigate} onDotsClick={handleDotsClick} />
      )}
      <SecondLayerNavBar
        visible={navState === 'second'}
        aiModal={aiModal}
        setAiModal={setAiModal}
        leftPanel={leftPanel}
        setLeftPanel={setLeftPanel}
      />
    </div>
  );
}

export default ReaderNavBar