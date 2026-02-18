import React from 'react'
import { ArrowLeft, Bookmark, EllipsisVertical, Fullscreen, Lock } from 'lucide-react'
function FirstLayerNavBar({ navigate }) {
  return (
    <div className='absolute top-0 left-0 right-0 z-50 flex flex-col  justify-between  p-2 w-full h-screen'>
      <div className='flex top-bar items-center justify-between w-full'>
        <div>
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className=' left-side flex items-center gap-2'>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Bookmark strokeWidth={1.5} size={20} />
          </button>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <EllipsisVertical strokeWidth={1.5} size={20} />
          </button>
        </div>
      </div>

      <div className="bottom-bar flex flex-col gap-4  items-center">
        <div className='flex items-center justify-between w-full'>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Lock strokeWidth={1.5} size={20} />
          </button>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Fullscreen strokeWidth={1.5} size={20} />
          </button>
        </div>
        <div className="progress w-[90%] ">
          <div className="progress-bar h-1.5 rounded-full w-full bg-accent-subtle">
            <div className="progress-fill h-1.5 rounded-full w-[50%] bg-accent-primary"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirstLayerNavBar