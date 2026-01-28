import React from 'react'
import { TextCursor} from 'lucide-react'

function HeroSection() {
  return (
    <div className='h-screen w-full relative pt-20'>
      
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        <div className='hero-section-content'>
            <div className='text-conetnt'>
                <h1 className='text-4xl sm:text-5xl font-bold sm:leading-relaxed text-center font-display'>Study Smarter
                    <br></br>
                    Reach Your <span className='inline-flex items-center'><mark className='px-2 sm:py-0 bg-accent-primary/30 italic'> Apex</mark><span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink'></span></span> 
                </h1>
            </div>
        </div>
    </div>
  )
}

export default HeroSection