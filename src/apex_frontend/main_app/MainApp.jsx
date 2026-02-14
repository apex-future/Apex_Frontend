import React from 'react'
import {useState} from "react"
import AsideNavBar from './components/layout/AsideNavBar'
import NavBarProvider from './components/layout/NavBarContext';
import Header from './components/home/Header'
import TopNavBar from './components/layout/TopNavBar';
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/BottomNavBar';
import Profile from './components/layout/user/Profile';
function MainApp() {
  let [asideIsOpen, setAsideIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openAside = () => {
    setAsideIsOpen(true)
  }
  const closeAside = () => {
    setAsideIsOpen(false)
  }

  let asideToggle = {
    closeAside,
    openAside
  }
  return (
    <div className='flex relative min-h-screen max-w-full overflow-x-hidden'>
   <div className="absolute top-0  z-[-2] min-h-full w-full bg-bg-primary bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
      </NavBarProvider>

      <div className='flex-1 overflow-hidden relative z-[10]'>
      <TopNavBar setIsMobileOpen={setIsMobileOpen}/>
      <main className="">
        <HomePage />
        {/* <Profile/> */}
     </main>
     <BottomNavBar />
      </div>

    </div>
  )
}

export default MainApp