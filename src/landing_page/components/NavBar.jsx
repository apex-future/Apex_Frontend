import React, { useState, useRef } from 'react'
import logoLight from "../../assets/logo/logo-light.jpg"
import { Menu, X } from 'lucide-react';

import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function NavBar() {
    let [asideIsOpen, setAsideIsOpen] = useState(false);
    let asideRef = useRef();

    useGSAP(() => {
        if (asideRef.current) {
            gsap.fromTo(asideRef.current, {
                x: 200,
                opacity: 0,
            }, {
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out"
            })
        }
    }, [asideIsOpen])

    const openAside = () => setAsideIsOpen(true)
    const closeAside = () => setAsideIsOpen(false)

    return (
        <div className='w-full nav-div p-4 py-4 fixed z-[100]'>
            <nav className='sm:w-[80%] w-[90%] justify-between p-4 mx-auto flex items-center backdrop-blur-md shadow-sm h-full bg-white/50 rounded-full border-2 border-default' aria-label="Main Navigation">
                <div>
                    <a href="#hero" aria-label="Apex Home">
                        <img className="size-8 rounded-full" alt="Apex Logo" src={logoLight} />
                    </a>
                </div>

                <div className="nav-icon md:hidden">
                    <button 
                        onClick={openAside} 
                        className="cursor-pointer p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        aria-label="Open navigation menu"
                        aria-expanded={asideIsOpen}
                        aria-controls="mobile-menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <ul className='md:flex hidden items-center gap-8 px-5 '>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#features" className='group-hover:text-accent-primary transition-colors duration-300'>Features</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" aria-hidden="true"></span>
                    </li>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#about" className='group-hover:text-accent-primary transition-colors duration-300'>About</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" aria-hidden="true"></span>
                    </li>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#faq" className='group-hover:text-accent-primary transition-colors duration-300'>FAQ</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" aria-hidden="true"></span>
                    </li>
                </ul>
                <div className="nav-bar-cta hidden md:flex items-center gap-4">
                    <Link to="/login" className='text-neutral-700 font-semibold hover:text-accent-primary transition-colors'>Sign In</Link>
                    <Link to="/signup" className='p-3 rounded-full px-6 text-center text-white bg-accent-primary font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.5)] hover:bg-opacity-90 active:scale-95 inline-block'>Get Started</Link>
                </div>
            </nav>

            {asideIsOpen &&
                <aside 
                    id="mobile-menu"
                    className='aside-bar fixed inset-0 z-[150] max-h-screen w-full p-4 flex bg-[rgb(8,9,12)] flex-col gap-8' 
                    ref={asideRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation menu"
                >
                    <button 
                        onClick={closeAside} 
                        className='md:hidden text-white cursor-pointer hover:text-accent-primary transition-colors p-2 self-start'
                        aria-label="Close navigation menu"
                    >
                        <X size={24} />
                    </button>
                    <div className='flex flex-col justify-between h-full pb-5'>
                        <nav aria-label="Mobile Navigation Links">
                            <ul className='flex flex-col gap-4 px-5'>
                                <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200'> 
                                    <a href="#features" onClick={closeAside}>Features </a> 
                                </li>
                                <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200'> 
                                    <a href="#about" onClick={closeAside}>About </a> 
                                </li>
                                <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200'> 
                                    <a href="#faq" onClick={closeAside}>FAQ</a> 
                                </li>
                            </ul>
                        </nav>

                        <div className='h-12'>
                            <Link to="/signup" className='p-4 rounded-full w-[272px] px-7 text-center text-white bg-accent-primary font-medium block mx-auto hover:bg-opacity-90 active:scale-95 transition-all' onClick={closeAside}>Get Started</Link>
                        </div>
                    </div>
                </aside>}
        </div>
    )
}

export default NavBar