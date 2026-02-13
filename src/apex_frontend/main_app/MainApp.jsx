import React from 'react'
import {useState} from "react"
import AsideNavBar from './components/AsideNavBar'
import NavBarProvider from './components/NavBarContext';
import Header from './components/Header'
import NavBar from './components/NavBar';
function MainApp() {
  let [asideIsOpen, setAsideIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openAside = () => {
      setAsideIsOpen(true)
  }
  const closeAside = () => {
      setAsideIsOpen(false)
  }

  let asideToggle ={
    closeAside,
    openAside
  }
  return (
    <div className='flex relative min-h-screen'>
   <div class="absolute top-0 z-[-2] h-screen w-screen bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
      </NavBarProvider>

      <div className='flex-1 overflow-auto '>
      <NavBar setIsMobileOpen={setIsMobileOpen}/>
      <main className="pt-5">
        <Header/>
     </main>
      </div>
    
    </div>
  )
}

export default MainApp