import React from 'react'
import feature1Img from "../../assets/ask-apex-ai.jpg"
import feature2Img from "../../assets/highlighting.jpg"
import feature3Img from "../../assets/dictionary.jpg"
import feature4Img from "../../assets/video.png"
import {Sparkles,Pen,Book} from 'lucide-react';
function Features() {
  return (
    <section className='fetaures-section pt-12 '>
            <Sparkles className="inline-block size-12 text-shadow-md md:size-20 text-purple-500 p-2 hover:opacity-100 opacity-0 transition-all duration-300 "/>
            <Pen className="inline-block size-12 md:size-20 text-yellow-500 p-2 hover:opacity-100 opacity-0 transition-all duration-300 "/>
            <Book className="inline-block size-12 md:size-20 text-bue-500 p-2 hover:opacity-100 opacity-0 transition-all duration-300 "/>
        <header>
            <h2 className='text-3xl font-semibold font-display p-2 px-4'>Four Ways <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> Apex </span> keeps you focused</h2>
        </header>

        <div className="feature-list grid sm:grid-cols-2 max-w-[1000px] gap-5 w-[90%] mx-auto mt-5">
            <div className='relative  rounded-lg border  h-[380px] flex flex-col overflow-hidden'>
                <div className="feature-organic-card h-full w-full  bg-blue-300" style={{clipPath: "path('M 50,340 A 10,20,0,0,0 40,360 L 40,380 L 0,380 L 0,0 L 350,0 L 350,340  Z')"}}>
                    {/* <img src={feature1Img} className='h-full w-full rounded-lg object-cover' ></img> */}
                </div>
                
                {/* <div className='paragraph-overlay  bg-black  rounded-lg shadow-inner shadow-gray-500 p-2 absolute right-0 bottom-0 mt-3'>
            

                 <p className="text-sm text-text-dark-secondary">   <span className='font-semibold text-white text-base pb-2'>Instant AI Explanations:</span><br />
   Highlight any text and get clear explanations without 
   opening a new tab.</p>
                </div> */}
                
            </div>
            <div className='relative rounded-lg border max-h-[380px] gap-2 flex flex-col overflow-hidden'>
                <img src={feature2Img} className='h-[75%] w-full rounded-lg object-cover' ></img>
                <div className='paragraph-overlay backdrop-blur-md w-full bg-linear-to-r from-gray-300 to-white p-2 absolute bottom-0 mt-3'>
                {/* <Sparkles className="inline-block size-8 text-white bg-accent-primary p-2 rounded-lg mr-2"/> */}
                 <p className="text-sm">   <span className='font-semibold text-base pb-2'>Smart Highlighting & Notes:</span><br />
                 
   Capture insights and build your personal study guide 
   as you read.</p>
                </div>
                
            </div>
            <div className='relative max-h-[380px]  rounded-lg border flex flex-col overflow-hidden'>
                <img src={feature3Img} className=' rounded-lg' ></img>
                <div className='paragraph-overlay bg-black  w-full p-2 absolute bottom-0 mt-3'>
                {/* <Sparkles className="inline-block size-8 text-white bg-accent-primary p-2 rounded-lg mr-2"/> */}
                 <p className="text-sm text-text-dark-secondary">   <span className='font-semibold text-white text-base pb-2'>  Built-in Dictionary:</span><br />  
   Look up definitions instantly—no app switching, no 
   breaking flow</p>
                </div>
                
            </div>
            <div className='relative max-h-[380px]  rounded-lg border flex flex-col overflow-hidden'>
                <img src={feature4Img} className=' rounded-lg' ></img>
                <div className='paragraph-overlay bg-black  w-full p-2 absolute bottom-0 mt-3'>
                {/* <Sparkles className="inline-block size-8 text-white bg-accent-primary p-2 rounded-lg mr-2"/> */}
                 <p className="text-sm text-text-dark-secondary">   <span className='font-semibold text-white text-base pb-2'> Curated Video Learning:</span><br />
         
   Get relevant YouTube explanations surfaced right 
   where you're studying.</p>
                </div>
                
            </div>
        </div>
    </section>
  )
}

export default Features