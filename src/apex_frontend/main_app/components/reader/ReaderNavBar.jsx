import React from 'react'
import { ArrowLeft, Settings, Bookmark, Share2 } from 'lucide-react';
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
function ReaderNavBar({ book, navigate, showNav }) {
    return (
        <div className={`reading-nav-bar h-full w-full relative transition-opacity duration-300 ${showNav ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
        <FirstLayerNavBar navigate={navigate} />
          
        </div>
    )
}

export default ReaderNavBar