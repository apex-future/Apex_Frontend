import React from 'react'
import { ArrowLeft, Settings, Bookmark, Share2 } from 'lucide-react';
import FirstLayerNavBar from './reading_navigations/FirstLayerNavBar';
function ReaderNavBar({ book, navigate }) {
    return (
        <div className='reading-nav-bar h-full w-full relative'>
        <FirstLayerNavBar />
          
        </div>
    )
}

export default ReaderNavBar