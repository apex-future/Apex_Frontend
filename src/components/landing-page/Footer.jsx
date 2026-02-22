import React from 'react'
import { Twitter, Linkedin, Instagram } from 'lucide-react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin, ScrollTrigger);

function Footer() {
  useGSAP(() => {
    gsap.to(".brand-name", {
      text: "APEX", // <-- This is what the text will animate to
      duration: 2,
      scrollTrigger: {
        trigger: ".brand-name", // Animate when this element enters the viewport
        start: "top 80%",       // When the top of the element hits 80% of viewport
        end: "top 60%",         // Optional: end scroll position
        toggleActions: "play none none none", // Only play once
      },
    });
  }, []);

  return (
    <footer className='bg-black pt-8 p-4 overflow-hidden relative'>



      <div className=" pointer-event-none absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:16px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="main-footer relative  z-[10]">
        <h2 className="brand-name pointer-events-none  absolute top-0 text-[12rem] sm:text-[17rem] text-transparent italic [-webkit-text-stroke:1px_rgba(192,192,192,0.4)]
  [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]
  blur-[1px] font-display">
          
        </h2>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-10">
      
      {/* Column 1: Brand */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          {/* Logo */}
          <h3 className="font-display text-2xl font-bold">Apex</h3>
        </div>
        <p className="text-text-dark-secondary text-sm md:text-base mb-6">
          Study smarter. <span className="text-purple-500">  Reach your apex. </span>
        </p>
        {/* Social Links */}
        <div className="flex gap-4">
          <a href="https://x.com/apex_future_" className="text-text-dark-secondary hover:text-accent-primary">
           
            <Twitter  className="w-5 h-5"  />
          </a>
          <a href="#" className="text-text-dark-secondary hover:text-accent-primary">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="text-text-dark-secondary hover:text-accent-primary">
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Column 2: Product */}
            <div>
              <h4 className="font-display font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm md:text-base text-text-dark-secondary">
                <li><a href="#features" className="hover:text-accent-primary ">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-accent-primary">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-accent-primary">Pricing</a></li>
                <li><a href="#roadmap" className="hover:text-accent-primary">Roadmap</a></li>
                <li><a href="#changelog" className="hover:text-accent-primary">Changelog</a></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="font-display font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm  md:text-base text-text-dark-secondary">
                <li><a href="#about" className="hover:text-accent-primary">About Us</a></li>
                <li><a href="#mission" className="hover:text-accent-primary">Mission & Vision</a></li>
                <li><a href="#blog" className="hover:text-accent-primary">Blog</a></li>
                <li><a href="#contact" className="hover:text-accent-primary">Contact</a></li>
              </ul>
            </div>

            {/* Column 4: Support & Legal */}
            <div>
              <h4 className="font-display font-semibold mb-6">Support</h4>
              <ul className="space-y-2 text-sm md:text-base text-text-dark-secondary">
                <li><a href="#faq" className="hover:text-accent-primary">FAQ</a></li>
                <li><a href="#help" className="hover:text-accent-primary">Help Center</a></li>
                <li><a href="#contact" className="hover:text-accent-primary">Contact Support</a></li>
                <li><a href="#privacy" className="hover:text-accent-primary">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-accent-primary">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border-default/20 mt-16 pt-8 text-center text-sm text-text-dark-tertiary">
            <p>&copy; 2026 Apex. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer