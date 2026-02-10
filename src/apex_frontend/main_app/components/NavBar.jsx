import React from 'react'
import {useContext,useRef} from 'react'
import { NavBarContext } from './NavBarContext'
import { Sparkle,Home,X, Book,Pen,Star,Cog, WholeWord,Menu } from 'lucide-react'
function NavBar() {
    let navLinksBar =useRef(null);
    let { closeAside} = useContext(NavBarContext);
    let isNavLinkClose = true;
    let toggleNavLink =()=>{
        navLinksBar.current.classList.toggle('hidden')
        navLinksBar.current.classList.toggle('flex')
          
    }
  return (

    <div className=' w-screen sm:w-fit fixed flex flex-col gap-10 bg-bg-subtle sm:bg-transparent h-screen p-5 '>
        <div className="toggle-icon">
        <X  onClick={closeAside} className=' sm:hidden pr-1'/>
        <Menu className='pr-1 hidden sm:block ' onClick={toggleNavLink}/>
        </div>
       
        <aside className="navbar-wrapper flex h-full gap-1 sm:border-r-2">
            <div className="icon-div flex flex-col justify-between  pr-3 ">
            <nav className='flex flex-col gap-10'>
           
                <ul className='flex flex-col gap-5'>
                <Home className='inline-block pr-1' /> 
                <Book className='inline-block pr-1' />
                <Star className='inline-block pr-1' />
                <Sparkle className='inline-block pr-1' />
                <WholeWord className='inline-block pr-1'/>
                <Pen  className='inline-block pr-1' />
                </ul>
            </nav>
           

            <div className="bottom-links">
                
                <ul>
                <Cog className='inline-block pr-1'/>
                  
                </ul>
            </div>
            </div>
           
           <div className="nav-links  flex-col justify-between hidden pr-5" ref={navLinksBar}>
            <ul className='flex flex-col gap-4'>
            <li className='text-lg font-medium'><a href="#books">Home</a></li>
                <li className='text-lg font-medium'><a href="#books"> Books</a></li>
                <li className='text-lg font-medium'><a href=""> Favourite</a></li>
                <li className='text-lg font-medium'><a href=""> Dictionary</a></li>
                <li className='text-lg font-medium'><a href=""> ApexAi</a></li>
                <li className='text-lg font-medium'><a href=""> Notes</a></li>
            </ul>

            <ul>
            <li className='text-lg font-medium'> Settings</li>
            </ul>
           </div>
        </aside>
      
    </div>
  )
}

export default NavBar