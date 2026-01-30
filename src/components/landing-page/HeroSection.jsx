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
        useGSAP(()=>{
            gsap.fromTo(".hero-img",{
                x: 200,
                duration:3,
            
            },
            {
                ease: "bounce.out",
                duration:3,
                x:0
            })
            },[])
         return (
    <div className='h-screen w-full relative pt-20 '>
      
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        <div className='hero-section-content p-3 flex flex-col gap-8'>
            <div className='text-content max-w-[800px] mx-auto'>
                <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold leading-tight sm:leading-snug md:leading-normal text-center font-display'>Study Smarter
                    <br></br>
                    Reach Your <span className='inline-flex items-center'>
                                <span className=' apex italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> </span>
                                <span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink'></span>
                        </span> 
                </h1>
                <h3 className='text-center p-2 text-text-primary sm:text-lg text-secondary md:text-xl'>Stop juggling tabs to understand one chapter. Apex brings AI 
explanations, definitions, and videos right where you're reading—
so you can stay focused</h3>

                
            </div>
            <div className="CTA-buttons flex flex-col mx-auto w-[80%] sm:flex-row justify-center items-center gap-3">
                <a href="" className='p-3 rounded-full w-full sm:w-1/2 max-w-[272px] border-2 px-5 text-center hover:bg-black hover:text-white text-white border-subtle bg-accent-primary font-medium md:text-lg '>Join the Waitlist</a>
                <a className=" p-3 px-5  w-full text-center rounded-full max-w-[272px] shadow-md md:text-lg sm:w-1/2 font-medium border-2   border-subtle bg-bg-elevated  hover:bg-black ">Get a Demo</a>
             

            </div>
            <div className="img-content overflow-hidden ">
                <img src={heroImg} alt="Apex dashboard" className="hero-img rounded-xl mx-auto hover:rotate-3 transition-all duration-75  shadow-lg" />
            </div>
        </div>
    </div>
  )
}

export default HeroSection