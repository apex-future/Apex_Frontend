import React from 'react'
import { TextCursor} from 'lucide-react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import heroImg from "../../assets/e-book-dashboard.jpg"
// Register the plugin
gsap.registerPlugin(TextPlugin);
   

    function HeroSection() {
        useGSAP(()=>{
        gsap.to(".apex",{
            text:"Apex",
            duration:2
        })
        },[])
         return (
    <div className='h-screen w-full relative pt-20'>
      
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        <div className='hero-section-content p-3 flex flex-col gap-5'>
            <div className='text-content max-w-[800px] mx-auto'>
                <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold leading-tight sm:leading-snug text-center font-display'>Study Smarter
                    <br></br>
                    Reach Your <span className='inline-flex items-center'>
                                <span className=' apex italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> </span>
                                <span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink'></span>
                        </span> 
                </h1>
                <h3 className='text-center p-2 text-text-primary '>Stop juggling tabs to understand one chapter. Apex brings AI 
explanations, definitions, and videos right where you're reading—
so you can stay in your zone and learn deeply.</h3>
            </div>
            <div className="img-content  ">
                <img src={heroImg} alt="Apex dashboard" className="hero-img mx-auto  shadow-lg" />
            </div>
        </div>
    </div>
  )
}

export default HeroSection