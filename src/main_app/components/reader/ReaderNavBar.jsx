import React from 'react'
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
import SecondLayerNavBar from './reading_navigations/SecondLayerNavBar';

function ReaderNavBar({ navigate, navState, setNavState, aiModal, setAiModal, quizModal, setQuizModal, leftPanel, setLeftPanel, pdfControls, readerControls, showPageStrip, closePageStrip, fileUrl, isPdf, scrollOrientation, onNotebookClick }) {
  const handleDotsClick = (e) => {
    e.stopPropagation();
    setNavState('second');
  };

  return (
    <div className="reading-nav-bar absolute inset-0 z-50 pointer-events-none h-full">
      {navState === 'first' && (
        <FirstLayerNavBar
          navigate={navigate}
          onDotsClick={handleDotsClick}
          readerControls={readerControls}
          scrollOrientation={scrollOrientation}
          onNotebookClick={onNotebookClick}
        />
      )}
      <SecondLayerNavBar
        visible={navState === 'second'}
        aiModal={aiModal}
        setAiModal={setAiModal}
        setQuizModal={setQuizModal}
        leftPanel={leftPanel}
        setLeftPanel={setLeftPanel}
        pdfControls={pdfControls}
      />
    </div>
  );
}

export default ReaderNavBar