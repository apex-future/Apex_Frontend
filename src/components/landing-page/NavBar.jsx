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

                <ul className='md:flex hidden items-center gap-8 px-6 '>
                    {['Features', 'About', 'FAQ'].map((item) => (
                        <li key={item} className='relative group font-medium cursor-pointer'>
                            <a href={`#${item.toLowerCase()}`} className='hover:text-accent-primary transition-colors duration-300'>{item}</a>
                            <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300'></span>
                        </li>
                    ))}
                </ul>

                <div className="nav-bar-cta hidden md:block">
                    <a href="#cta" className='p-3 rounded-full px-6 text-center text-white bg-accent-primary font-medium hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-accent-primary/20'>
                        Request Private Access
                    </a>
                </div>
            </nav>

            {asideIsOpen && (
                <aside className='aside-bar fixed h-screen w-screen p-6 flex bg-[rgb(8,9,12)] flex-col gap-10 top-0 bottom-0 left-0 mx-auto right-0 z-[200]' ref={asideRef}>
                    <div className="flex justify-between items-center">
                        <img className="size-8 rounded-full" alt="apex-logo" src={logoLight} />
                        <X onClick={closeAside} className='text-white cursor-pointer hover:text-accent-primary transition-colors' />
                    </div>

                    <div className='flex flex-col justify-between h-full pb-10'>
                        <ul className='flex flex-col gap-6'>
                            {['Features', 'About', 'FAQ'].map((item) => (
                                <li key={item} className='text-white text-2xl font-medium hover:text-accent-primary transition-colors cursor-pointer' onClick={closeAside}>
                                    <a href={`#${item.toLowerCase()}`}>{item}</a>
                                </li>
                            ))}
                        </ul>

                        <div className='w-full'>
                            <a href="#cta" className='p-4 rounded-full w-full block text-center text-white bg-accent-primary font-medium hover:bg-opacity-90 active:scale-95 transition-all' onClick={closeAside}>
                                Request Private Access
                            </a>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    )
}

export default NavBar