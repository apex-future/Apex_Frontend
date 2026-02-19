import React from 'react'
import logoLight from "../../assets/logo/logo-light.jpg"
import { Menu, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
function NavBar() {
    let asideRef = useRef();
    useGSAP(() => {
        gsap.fromTo(asideRef.current, {
            x: 200,
            opacity: 0,
            duration: 2,
            ease: "bounce"
        }, {
            x: 0,
            opacity: 1,
            duration: 2,
            ease: "bounce"
        })
    }, [])
    let [asideIsOpen, setAsideIsOpen] = useState(false);

    const openAside = () => {
        setAsideIsOpen(true)
    }
    const closeAside = () => {
        setAsideIsOpen(false)
    }
    return (
        <div className='w-full nav-div p-3 py-4 fixed z-[100]'>
            <nav className='sm:w-[80%] w-[90%] justify-between p-3 mx-auto flex items-center backdrop-blur-md shadow-sm h-full bg-white/50 rounded-full border-2 border-default'>
                <div>
                    <a href="#hero">
                        <img className="size-8 rounded-full" alt="apex-logo" src={logoLight} />
                    </a>

                </div>
                <div className="nav-icon md:hidden">
                    <Menu onClick={openAside} />
                </div>
                <ul className='md:flex hidden items-center gap-8 px-6 '>
                    <li className='relative group font-medium'>
                        <a href="#features" className='hover:text-accent-primary transition-colors duration-300'>Features </a>
                        <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300'></span>
                    </li>
                    <li className='relative group font-medium'>
                        <a href="#about" className='hover:text-accent-primary transition-colors duration-300'>About </a>
                        <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300'></span>
                    </li>
                    <li className='relative group font-medium'>
                        <a href="#faq" className='hover:text-accent-primary transition-colors duration-300'>FAQ</a>
                        <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300'></span>
                    </li>
                </ul>
                <div className="nav-bar-cta hidden md:block">
                    <a href="#cta" className='p-3 rounded-full px-5 text-center text-white bg-accent-primary font-medium hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-accent-primary/20'>Request Private Access</a>
                </div>
            </nav>

            {asideIsOpen &&
                <aside className='aside-bar fixed h-screen w-screen p-3 flex bg-[rgb(8,9,12)] flex-col gap-10 top-0 bottom-0 left-0 mx-auto right-0' ref={asideRef}>
                    <X onClick={closeAside} className='md:hidden text-white' />
                    <div className='flex flex-col justify-between h-full pb-5'>
                        <ul className='flex flex-col gap-2 px-5'>
                            <li className=' text-white text-lg font-medium' onClick={closeAside}> <a href="#features">Features </a> </li>
                            <li className='text-white text-lg font-medium' onClick={closeAside}> <a href="#about">About </a> </li>
                            <li className='text-white text-lg font-medium' onClick={closeAside}> <a href="#faq">FAQ</a> </li>


                        </ul>

                        <div className='h-12'>
                            <a href="#cta" className='p-4 rounded-full w-[272px] px-7 text-center text-white bg-accent-primary font-medium hover:bg-accent-hover active:scale-95 transition-all duration-300'>Request Private Access</a>
                        </div>
                    </div>

                </aside>}
        </div>
    )
}

export default NavBar