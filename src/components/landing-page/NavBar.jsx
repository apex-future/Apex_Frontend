import React from 'react'
import logoLight from "../../assets/logo/logo-light.jpg"
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

function NavBar() {
    let [asideIsOpen,setAsideIsOpen]= useState(false);

    const openAside = ()=>{
        setAsideIsOpen(true)
    }
    const closeAside = ()=>{
        setAsideIsOpen(false)
    }
  return (
    <div className='w-full nav-div p-3 fixed z-[100]'>
        <nav className='w-[95%] justify-between p-2 mx-auto flex items-center shadow-sm h-12 bg-bg-subtle rounded-full border-2 border-default'>
            <div>
                <img  className="size-8 rounded-full" alt="apex-logo" src={logoLight} />
            </div>
            <div className="nav-icon">
                <Menu onClick={openAside} />
            </div>

           {asideIsOpen &&
            <aside className='fixed h-screen w-full p-3 flex bg-accent-subtle top-0 bottom-0 left-0 right-0'>
                <X onClick={closeAside} className='md:hidden'/>
            </aside>}
        </nav>
        
    </div>
  )
}

export default NavBar