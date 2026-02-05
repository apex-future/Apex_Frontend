import React from 'react'
import logoLight from "../../assets/logo/logo-light.jpg"
import { Menu, X } from 'lucide-react';
import { useState,useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
function NavBar() {
    let asideRef = useRef();
    useGSAP(()=>{
        gsap.fromTo(asideRef.current,{
            x:200,
            opacity:0,
            duration:2,
            ease:"bounce"
        },{
            x:0,
            opacity:1,
            duration:2,
            ease:"bounce"
        })
    },[])
    let [asideIsOpen,setAsideIsOpen]= useState(false);

    const openAside = ()=>{
        setAsideIsOpen(true)
    }
    const closeAside = ()=>{
        setAsideIsOpen(false)
    }
  return (
    <div className='w-full nav-div p-3 py-4 fixed z-[100]'>
        <nav className='sm:w-[80%] w-[90%] justify-between p-3 mx-auto flex items-center backdrop-blur-md shadow-sm h-full bg-white/50 rounded-full border-2 border-default'>
            <div>
                <a href="#home"></a>
                <img  className="size-8 rounded-full" alt="apex-logo" src={logoLight} />
            </div>
            <div className="nav-icon md:hidden">
                <Menu onClick={openAside} />
            </div>
            <ul className='md:flex hidden items-center gap-4 px-5 '>
                    <li className='  font-medium'> <a href="#features">Features </a> </li>
                    <li className=' font-medium'> <a href="#about">About </a> </li>
                    <li className=' font-medium'> <a href="#faq">FAQ</a> </li>
                   
                </ul>
                <div className="nav-bar-cta hidden md:block">
                <a href="#cta" className='p-3 rounded-full  px-5 text-center text-white bg-accent-primary font-medium '>Join the Waitlist</a>
                </div>
        </nav>
        
        {asideIsOpen &&
            <aside className='aside-bar fixed h-screen w-screen p-3 flex bg-[rgb(8,9,12)] flex-col gap-10 top-0 bottom-0 left-0 mx-auto right-0' ref={asideRef}>
                <X onClick={closeAside} className='md:hidden text-white'/>
                <div className='flex flex-col justify-between h-full pb-5'>
                <ul className='flex flex-col gap-2 px-5'>
                <li className=' text-white text-lg font-medium'> <a href="#features">Features </a> </li>
                    <li className='text-white text-lg font-medium'> <a href="#about">About </a> </li>
                    <li className='text-white text-lg font-medium'> <a href="#faq">FAQ</a> </li>
                 
                    
                </ul>

                    <div className='h-12'>
                        <a href="#cta" className='p-4 rounded-full w-[272px] px-7 text-center text-white bg-accent-primary font-medium '>Join the Waitlist</a>
                    </div>
                </div>
          
            </aside>}
    </div>
  )
}

export default NavBar