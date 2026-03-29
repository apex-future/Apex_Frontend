import React, { useContext, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookContext } from "../../../context/BookContextInstance"
import Shelf from './Shelf'
import useSpaceStore from '../../../store/spaceStore'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  const navigate = useNavigate();
  const { shelves } = useContext(BookContext);
  const { createSpace } = useSpaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleCreateSpace = (e) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
      setIsCreating(false);
    }
  };

  return (
    <div className='w-full'>
      {/* Page Header - Glassmorphic with Dark Adaptation */}
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          <h3 className='text-xl font-bold font-display text-text-primary'>Book Spaces</h3>

          <button
            onClick={() => setIsCreating(true)}
            className="p-2 hover:bg-accent-primary/10 text-accent-primary rounded-xl transition-all"
            title="Create Space"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <form onSubmit={handleCreateSpace} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="Space Name (e.g., JAMB 2026)"
              className="flex-1 px-4 py-2 rounded-xl border border-border-default bg-white dark:bg-zinc-900 focus:outline-none focus:border-accent-primary"
            />
            <button type="submit" className="px-4 py-2 bg-accent-primary text-white rounded-xl font-bold">
              Save
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border border-border-default rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf