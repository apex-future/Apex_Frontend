import React from 'react'
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
import SecondLayerNavBar from './reading_navigations/SecondLayerNavBar';

function ReaderNavBar({ book, navigate, navState, setNavState, aiModal, setAiModal, leftPanel, setLeftPanel, pdfControls, readerControls }) {
  const handleDotsClick = (e) => {
    e.stopPropagation();
    setNavState('second');
  };

  return (
    <div className="reading-nav-bar absolute inset-0 z-50 pointer-events-none">
      {navState === 'first' && (
        <FirstLayerNavBar navigate={navigate} onDotsClick={handleDotsClick} readerControls={readerControls} />
      )}
      <SecondLayerNavBar
        visible={navState === 'second'}
        aiModal={aiModal}
        setAiModal={setAiModal}
        leftPanel={leftPanel}
        setLeftPanel={setLeftPanel}
        pdfControls={pdfControls}
      />
    </div>
  );
}

export default ReaderNavBar