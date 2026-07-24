import React, { useState } from 'react';
import { Highlighter, Note, BookOpen, X, Sparkle, ArrowLeft, Lock } from '@phosphor-icons/react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ListItem from '../ui/ListItem';

function FlashcardSourceModal({ isOpen, onClose, onConfirm, totalPages, currentPage, highlightCount, tabCount, wordCount }) {
  const [step, setStep] = useState('source'); // 'source' | 'filter'
  const [selectedSource, setSelectedSource] = useState(null); // 'highlights' | 'tabs' | 'words'
  const [pageFrom, setPageFrom] = useState(currentPage || 1);
  const [pageTo, setPageTo] = useState(Math.min((currentPage || 1) + 9, totalPages || 1));
  const [selectedWordCount, setSelectedWordCount] = useState(Math.min(wordCount || 10, 20));
  const [filterError, setFilterError] = useState('');

  if (!isOpen) return null;

  const handleSourceSelect = (source) => {
    const counts = { highlights: highlightCount, tabs: tabCount, words: wordCount };
    if (counts[source] === 0) return;
    setSelectedSource(source);
  };

  const handleNext = () => {
    if (!selectedSource) return;
    setPageFrom(currentPage || 1);
    setPageTo(Math.min((currentPage || 1) + 9, totalPages || 1));
    setSelectedWordCount(Math.min(wordCount || 10, 20));
    setFilterError('');
    setStep('filter');
  };

  const handleBack = () => {
    setStep('source');
    setFilterError('');
  };

  const handleConfirm = () => {
    let config;
    if (selectedSource === 'words') {
      config = { sourceCategory: 'words', wordCount: selectedWordCount };
    } else {
      if (pageTo < pageFrom) {
        setFilterError('End page must be after start page');
        return;
      }
      config = { sourceCategory: selectedSource, pageFrom, pageTo };
    }
    console.log('[FlashcardSourceModal] onConfirm called with config:', config);
    onConfirm(config);
  };

  const sourceCards = [
    {
      key: 'highlights',
      label: 'Highlights',
      icon: Highlighter,
      count: highlightCount,
      subtitle: highlightCount > 0 ? `${highlightCount} highlight${highlightCount !== 1 ? 's' : ''} saved` : 'None saved yet',
    },
    {
      key: 'tabs',
      label: 'Tabs',
      icon: Note,
      count: tabCount,
      subtitle: tabCount > 0 ? `${tabCount} tab${tabCount !== 1 ? 's' : ''} saved` : 'None saved yet',
    },
    {
      key: 'words',
      label: 'Words',
      icon: BookOpen,
      count: wordCount,
      subtitle: wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? 's' : ''} saved` : 'None saved yet',
    },
  ];

  const maxSlider = Math.min(wordCount || 1, 50);
  const minSlider = 5;

  const titleText = step === 'source' ? 'Generate Flashcards' : selectedSource === 'words' ? 'How many words?' : 'Which pages?';

  const modalHeader = (
    <div className="flex items-center justify-between w-full">
      {step === 'filter' ? (
        <button
          onClick={handleBack}
          className="text-text-secondary hover:text-text-primary text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
      ) : (
        <span />
      )}
      <span className="text-base font-bold text-text-primary font-display">{titleText}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-bg-subtle rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalHeader}
    >
      {step === 'source' && (
        <div className="flex flex-col gap-2.5 py-1">
          {sourceCards.map((card) => {
            const isDisabled = card.count === 0;
            const isSelected = selectedSource === card.key;

            return (
              <ListItem
                key={card.key}
                icon={isDisabled ? Lock : card.icon}
                label={card.label}
                subComponent={<span className="text-xs text-text-tertiary font-medium">{card.subtitle}</span>}
                isActive={isSelected}
                onClick={() => handleSourceSelect(card.key)}
                className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
              />
            );
          })}

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!selectedSource}
            className="mt-3 w-full !max-w-none py-3 text-sm font-bold"
          >
            Next →
          </Button>
        </div>
      )}

      {step === 'filter' && (
        <div className="flex flex-col gap-4 py-1">
          {(selectedSource === 'highlights' || selectedSource === 'tabs') && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">From page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageFrom}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setPageFrom(val);
                      if (val > pageTo) setFilterError('End page must be after start page');
                      else setFilterError('');
                    }}
                    className="bg-bg-subtle border border-border-default rounded-xl px-3 py-2.5 text-sm font-bold text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  />
                </div>
                <div className="text-text-tertiary mt-5 font-bold">–</div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">To page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageTo}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setPageTo(val);
                      if (val < pageFrom) setFilterError('End page must be after start page');
                      else setFilterError('');
                    }}
                    className={`bg-bg-subtle border ${filterError ? 'border-red-500' : 'border-border-default'} rounded-xl px-3 py-2.5 text-sm font-bold text-text-primary focus:outline-none ${!filterError && 'focus:border-accent-primary'} transition-colors`}
                  />
                </div>
              </div>

              {filterError && (
                <p className="text-xs text-red-500 font-semibold">{filterError}</p>
              )}

              <p className="text-xs text-text-tertiary leading-relaxed">
                Cards will be generated from all {selectedSource} between these pages
              </p>
            </>
          )}

          {selectedSource === 'words' && (
            <>
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="text-4xl font-black text-accent-primary">{selectedWordCount}</span>
                <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">words</span>
              </div>
              <input
                type="range"
                min={minSlider}
                max={maxSlider}
                value={selectedWordCount}
                onChange={(e) => setSelectedWordCount(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'rgb(var(--accent-primary))' }}
              />
              <div className="flex justify-between text-[10px] text-text-tertiary font-bold">
                <span>{minSlider}</span>
                <span>{maxSlider}</span>
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">
                Cards will be generated from your most recently saved words
              </p>
            </>
          )}

          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!!filterError}
            className="mt-3 w-full !max-w-none py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Sparkle size={18} weight="fill" />
            Generate Cards
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default FlashcardSourceModal;
