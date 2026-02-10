import React from 'react'
import {useState} from "react"
import NavBar from './components/NavBar'
import NavBarProvider from './components/NavBarContext';
function MainApp() {
  let [asideIsOpen, setAsideIsOpen] = useState(true);

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
    <div className='flex min-h-screen'>

      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <NavBar />}
      </NavBarProvider>
     <main className="flex-1 overflow-auto">

     </main>
    </div>
  )
}

export default MainApp