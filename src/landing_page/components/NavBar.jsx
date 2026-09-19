import React, { useState, useRef } from 'react';
import logoLight from "../../assets/logo/logo-dark-removebg-preview.png"; // Using the dark theme logo
import { List, X } from '@phosphor-icons/react';
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
                duration: 0.6,
                ease: "apple"
            })
        }
    }, [asideIsOpen])

    const openAside = () => setAsideIsOpen(true)
    const closeAside = () => setAsideIsOpen(false)

    return (
        <div className='w-full nav-div p-4 py-6 fixed z-[100] top-0'>
            <nav className='max-w-[1200px] w-[90%] justify-between px-6 py-4 mx-auto flex items-center backdrop-blur-2xl shadow-aura-sm h-full bg-surface-overlay/80 rounded-full border-t border-border-default/10' aria-label="Main Navigation">
                
                {/* Logo */}
                <div>
                    <a href="#hero" aria-label="Apex Home">
                        <img className="h-8 object-contain" alt="Apex Logo" src={logoLight} />
                    </a>
                </div>

                {/* Mobile Hamburger */}
                <div className="nav-icon md:hidden">
                    <button 
                        onClick={openAside} 
                        className="cursor-pointer p-2 hover:bg-surface-raised rounded-full transition-colors text-text-primary"
                        aria-label="Open navigation menu"
                        aria-expanded={asideIsOpen}
                        aria-controls="mobile-menu"
                    >
                        <List size={24} weight="regular" />
                    </button>
                </div>

                {/* Desktop Links */}
                <ul className='md:flex hidden items-center gap-8 px-5'>
                    <li className='font-sans text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer'>
                        <a href="#problem-section">Why Apex</a>
                    </li>
                    <li className='font-sans text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer'>
                        <a href="#reading-experience">Features</a>
                    </li>
                    <li className='font-sans text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer'>
                        <a href="#faq">FAQ</a>
                    </li>
                </ul>

                {/* Desktop CTA */}
                <div className="nav-bar-cta hidden md:flex items-center gap-4">
                    <Link to="/login" className='text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors'>Sign In</Link>
                    <Link to="/signup" className='aura-btn-primary px-6 py-2.5 text-sm shadow-aura-sm'>Start learning</Link>
                </div>
            </nav>

            {/* Mobile Aside */}
            {asideIsOpen &&
                <aside 
                    id="mobile-menu"
                    className='aside-bar fixed inset-0 z-[150] max-h-screen w-full p-4 flex bg-surface-base flex-col gap-8' 
                    ref={asideRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation menu"
                >
                    <button 
                        onClick={closeAside} 
                        className='md:hidden text-text-primary cursor-pointer hover:bg-surface-raised rounded-full transition-colors p-2 self-end'
                        aria-label="Close navigation menu"
                    >
                        <X size={24} weight="bold" />
                    </button>
                    <div className='flex flex-col justify-between h-full pb-10'>
                        <nav aria-label="Mobile Navigation Links">
                            <ul className='flex flex-col gap-6 px-5'>
                                <li className='text-text-primary font-display text-2xl font-medium hover:text-brand transition-colors duration-200'> 
                                    <a href="#problem-section" onClick={closeAside}>Why Apex</a> 
                                </li>
                                <li className='text-text-primary font-display text-2xl font-medium hover:text-brand transition-colors duration-200'> 
                                    <a href="#reading-experience" onClick={closeAside}>Features</a> 
                                </li>
                                <li className='text-text-primary font-display text-2xl font-medium hover:text-brand transition-colors duration-200'> 
                                    <a href="#faq" onClick={closeAside}>FAQ</a> 
                                </li>
                                <li className='text-text-primary font-display text-2xl font-medium hover:text-brand transition-colors duration-200 mt-4 pt-4 border-t border-border-default/10'> 
                                    <Link to="/login" onClick={closeAside}>Sign In</Link> 
                                </li>
                            </ul>
                        </nav>

                        <div className='px-5'>
                            <Link to="/signup" className='aura-btn-primary w-full py-4 text-center text-lg block shadow-aura-sm' onClick={closeAside}>Start learning</Link>
                        </div>
                    </div>
                </aside>}
        </div>
    );
}

export default NavBar;