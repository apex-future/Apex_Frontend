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
    <div>
      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <NavBar />}
      </NavBarProvider>
     
    </div>
  )
}

export default MainApp