import React, { useRef } from 'react';
import WaitlistForm from './WaitlistForm';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function CTA({ onLogin }) {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        toggleActions: "play none none reverse"
      }
    });

    tl.fromTo(".cta-text-content", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
      .fromTo(".cta-form-wrapper", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8, ease: "apple" }, "-=0.4");
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="w-full relative py-24 md:py-32 bg-surface-base overflow-hidden" id="cta" aria-labelledby="cta-heading">
      
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-brand-v opacity-[0.03]" aria-hidden="true"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Left Side: Copy */}
        <div className="cta-text-content flex flex-col gap-6 text-center lg:text-left">
          <h2 id="cta-heading" className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-text-primary tracking-tight">
            Your next chapter starts here.
          </h2>
          <p className="text-lg md:text-xl text-text-secondary leading-relaxed font-sans max-w-lg mx-auto lg:mx-0">
            Everything you need to study with more clarity, in one place. Stop jumping between tools and start understanding.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="cta-form-wrapper w-full max-w-md mx-auto lg:max-w-none">
          <WaitlistForm onLogin={onLogin} />
        </div>
        
      </div>
    </section>
  );
}

export default CTA;