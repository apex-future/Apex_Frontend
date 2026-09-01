import { House, Plus, User, Scroll, Binoculars } from '@phosphor-icons/react'
import React, { useContext, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { BookContext } from '../../../context/BookContextInstance';
import { NavBarContext } from './NavBarContextInstance';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function BottomNavBar() {
  const { addBookToShelf } = useContext(BookContext) || {};
  const { setIsNotificationOpen, unreadNotificationCount } = useContext(NavBarContext) || {};
  const navRef = useRef(null);

  useGSAP(() => {
    const showAnim = gsap.from(navRef.current, {
      yPercent: 200,
      paused: true,
      duration: 0.4,
      ease: "back.out(1.2)"
    }).progress(1);

    ScrollTrigger.create({
      start: "top top",
      end: "+=1000000",
      onUpdate: (self) => {
        self.direction === -1 ? showAnim.play() : showAnim.reverse();
      }
    });

    // Allow guided tour to explicitly bring the bottom bar up
    const handleForceShow = () => {
      if (navRef.current) {
        gsap.to(navRef.current, { yPercent: 0, duration: 0.35, ease: "power2.out" });
      }
    };
    window.addEventListener('apex-force-show-bottom-nav', handleForceShow);
    return () => window.removeEventListener('apex-force-show-bottom-nav', handleForceShow);
  }, { scope: navRef });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Pass the files to the context
    files.forEach((file) => {
      addBookToShelf(file);
    });
    e.target.value = '';
  };
  return (
    <div
      ref={navRef}
      className='fixed bottom-0 left-0 right-0 md:hidden flex justify-between w-full z-[100] min-h-14 border-t border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl items-center p-2 px-8 shadow-sm'
    >
      <NavLink
        to="/"
        className={() => `p-2 hover:bg-neutral-100/50 dark:hover:bg-white/10 rounded-full transition-all relative flex flex-col items-center group`}
      >
        {({ isActive }) => (
          <>
            {isActive
              ? <House size={20} weight="fill" className="text-accent-primary" />
              : <House size={20} weight="bold" className="text-[#404040] dark:text-zinc-400" />
            }
            {isActive && (
              <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            )}
          </>
        )}
      </NavLink>



      <NavLink
        to="/quest"
        className={() => `p-2 hover:bg-neutral-100/50 dark:hover:bg-white/10 rounded-full transition-all relative flex flex-col items-center group`}
      >
        {({ isActive }) => (
          <>
            {/* migrated from lucide: ScrollText */}
            {isActive
              ? <Scroll size={20} weight="fill" className="text-accent-primary" />
              : <Scroll size={20} weight="bold" className="text-[#404040] dark:text-zinc-400" />
            }
            {isActive && (
              <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            )}
          </>
        )}
      </NavLink>

      <div className="flex items-center">
        {/* Hidden Input */}
        <input
          type="file"
          id="nav-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.epub"
          multiple
        />

        {/* Connect Button to Input */}
        <label
          id="tour-add-book-mobile"
          htmlFor="nav-upload"
          className='bg-accent-primary hover:bg-accent-hover size-11 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center transform'
        >
          <Plus className='text-white' size={24} weight="bold" />
        </label>
      </div>

      <NavLink
        to="/discover"
        className={() => `p-2 hover:bg-neutral-100/50 dark:hover:bg-white/10 rounded-full transition-all relative flex flex-col items-center group`}
      >
        {({ isActive }) => (
          <>
            {isActive
              ? <Binoculars size={20} weight="fill" className="text-accent-primary" />
              : <Binoculars size={20} weight="bold" className="text-[#404040] dark:text-zinc-400" />
            }
            {isActive && (
              <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            )}
          </>
        )}
      </NavLink>
      <NavLink
        to="/profile"
        className={() => `p-2 hover:bg-neutral-100/50 dark:hover:bg-white/10 rounded-full transition-all relative flex flex-col items-center group`}
      >
        {({ isActive }) => (
          <>
            {isActive
              ? <User size={20} weight="fill" className="text-accent-primary" />
              : <User size={20} weight="bold" className="text-[#404040] dark:text-zinc-400" />
            }
            {isActive && (
              <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            )}
          </>
        )}
      </NavLink>
    </div>
  )
}

export default BottomNavBar