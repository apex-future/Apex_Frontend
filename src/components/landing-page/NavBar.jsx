import React, { useState, useRef } from 'react'
import logoLight from "../../assets/logo/logo-light.jpg"
import { Menu, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function NavBar() {
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
    }, [asideRef.current])

    let [asideIsOpen, setAsideIsOpen] = useState(false);

    const openAside = () => setAsideIsOpen(true)
    const closeAside = () => setAsideIsOpen(false)

    return (
        <div className='w-full nav-div p-3 py-4 fixed z-[100]'>
            <nav className='sm:w-[80%] w-[90%] justify-between p-3 mx-auto flex items-center backdrop-blur-md shadow-sm h-full bg-white/50 rounded-full border-2 border-default'>
                <div>
                    <a href="#hero">
                        <img className="size-8 rounded-full" alt="apex-logo" src={logoLight} />
                    </a>
                </div>

                <div className="nav-icon md:hidden">
                    <Menu onClick={openAside} className="cursor-pointer" />
                </div>

                <ul className='md:flex hidden items-center gap-8 px-5 '>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#features" className='group-hover:text-accent-primary transition-colors duration-300'>Features</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full"></span>
                    </li>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#about" className='group-hover:text-accent-primary transition-colors duration-300'>About</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full"></span>
                    </li>
                    <li className='font-medium relative group cursor-pointer'>
                        <a href="#faq" className='group-hover:text-accent-primary transition-colors duration-300'>FAQ</a>
                        <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full"></span>
                    </li>
                </ul>
                <div className="nav-bar-cta hidden md:block">
                    <a href="#cta" className='p-3 rounded-full px-6 text-center text-white bg-accent-primary font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.5)] hover:bg-opacity-90 active:scale-95 inline-block'>Request Private Access</a>
                </div>
            </nav>

            {asideIsOpen &&
                <aside className='aside-bar fixed max-h-screen w-screen p-3 flex bg-[rgb(8,9,12)] flex-col gap-10 top-0 bottom-0 left-0 mx-auto right-0' ref={asideRef}>
                    <X onClick={closeAside} className='md:hidden text-white cursor-pointer hover:text-accent-primary transition-colors' />
                    <div className='flex flex-col justify-between h-full pb-5'>
                        <ul className='flex flex-col gap-4 px-5'>
                            <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200' onClick={closeAside}> <a href="#features">Features </a> </li>
                            <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200' onClick={closeAside}> <a href="#about">About </a> </li>
                            <li className='text-white text-lg font-medium hover:text-accent-primary transition-colors duration-200' onClick={closeAside}> <a href="#faq">FAQ</a> </li>
                        </ul>

                        <div className='h-12'>
                            <a href="#cta" className='p-4 rounded-full w-[272px] px-7 text-center text-white bg-accent-primary font-medium block mx-auto hover:bg-opacity-90 active:scale-95 transition-all' onClick={closeAside}>Request Private Access</a>
                        </div>
                    </div>
                </aside>}
        </div>
    )
}

export default NavBar