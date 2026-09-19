import React from 'react';
import { Link } from 'react-router-dom';
import { TwitterLogo, LinkedinLogo, InstagramLogo } from '@phosphor-icons/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import logoLight from "../../assets/logo/logo-dark-removebg-preview.png";

gsap.registerPlugin(TextPlugin, ScrollTrigger);

function Footer() {
  useGSAP(() => {
    gsap.to(".brand-name", {
      text: "APEX", 
      duration: 2,
      scrollTrigger: {
        trigger: ".brand-name", 
        start: "top 80%",       
        end: "top 60%",         
        toggleActions: "play none none none", 
      },
    });
  }, []);

  return (
    <footer className='bg-surface-base pt-16 pb-8 px-6 overflow-hidden relative border-t border-border-default/5' aria-label="Site Footer">

      <div className="main-footer relative z-[10]">
        <div className="brand-name pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-[8rem] sm:text-[12rem] lg:text-[16rem] text-transparent italic [-webkit-text-stroke:1px_rgba(255,255,255,0.03)] font-display select-none" aria-hidden="true">
        </div>

        <div className="max-w-[1200px] mx-auto relative z-20 pt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24">
      
            {/* Column 1: Brand */}
            <div className="flex flex-col gap-6">
              <a href="#hero" className="inline-block">
                <img src={logoLight} alt="Apex Logo" className="h-8 object-contain" />
              </a>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed font-sans">
                Stop jumping between tools. <br/>Start understanding.
              </p>
              {/* Social Links */}
              <nav className="flex gap-4 mt-2" aria-label="Social Media Links">
                <a href="https://x.com/apex_future_" className="text-text-tertiary hover:text-text-primary transition-colors p-2 -ml-2 rounded-full hover:bg-surface-raised" aria-label="Follow Apex on Twitter">
                  <TwitterLogo className="w-5 h-5" aria-hidden="true" weight="fill" />
                </a>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-surface-raised" aria-label="Follow Apex on Instagram">
                  <InstagramLogo className="w-5 h-5" aria-hidden="true" weight="fill" />
                </a>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-surface-raised" aria-label="Follow Apex on LinkedIn">
                  <LinkedinLogo className="w-5 h-5" aria-hidden="true" weight="fill" />
                </a>
              </nav>
            </div>

            {/* Column 2: Product */}
            <div>
              <h3 className="font-display text-text-primary font-semibold mb-6 uppercase tracking-wider text-sm">Product</h3>
              <ul className="flex flex-col gap-4 text-sm md:text-base text-text-secondary font-sans">
                <li><a href="#reading-experience" className="hover:text-brand transition-colors">Features</a></li>
                <li><a href="#problem-section" className="hover:text-brand transition-colors">Why Apex</a></li>
                <li><Link to="/login" className="hover:text-brand transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-brand transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h3 className="font-display text-text-primary font-semibold mb-6 uppercase tracking-wider text-sm">Company</h3>
              <ul className="flex flex-col gap-4 text-sm md:text-base text-text-secondary font-sans">
                <li><a href="#about" className="hover:text-brand transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 4: Support & Legal */}
            <div>
              <h3 className="font-display text-text-primary font-semibold mb-6 uppercase tracking-wider text-sm">Support</h3>
              <ul className="flex flex-col gap-4 text-sm md:text-base text-text-secondary font-sans">
                <li><a href="#faq" className="hover:text-brand transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Help Center</a></li>
                <li><Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link></li>
                <li><a href="#" className="hover:text-brand transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border-default/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-tertiary font-sans">
            <p>&copy; {new Date().getFullYear()} Apex Education. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Made for ambitious students.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;