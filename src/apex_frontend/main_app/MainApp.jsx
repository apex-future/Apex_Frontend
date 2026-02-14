import React from 'react'
import {useState} from "react"
import AsideNavBar from './components/AsideNavBar'
import NavBarProvider from './components/NavBarContext';
import Header from './components/home/Header'
import TopNavBar from './components/TopNavBar';
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/BottomNavBar';
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
    <div className='flex relative min-h-screen'>
   <div className="absolute top-0 z-[-2] min-h-full w-screen bg-bg-primary bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
      </NavBarProvider>

      <div className='flex-1 overflow-auto relative z-[10]'>
      <TopNavBar setIsMobileOpen={setIsMobileOpen}/>
      <main className="pt-5 ">
        <HomePage />
     </main>
     <BottomNavBar />
      </div>

    </div>
  )
}

export default MainApp