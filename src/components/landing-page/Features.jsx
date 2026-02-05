import React from 'react'
import {Sparkles,Pen,Book,PlaySquare} from 'lucide-react';
function Features() {
  return (
    <section className='fetaures-section pt-14 ' id='features'>
          
            
            
        <header>
            <h2 className='text-3xl font-semibold font-display p-2 px-4'>Four Ways <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> Apex </span> keeps you focused</h2>
        </header>

        <div className="feature-list grid sm:grid-cols-2 max-w-[1000px] gap-5 w-[90%] mx-auto mt-5">
            <div className='relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] flex flex-col overflow-hidden'>
            <Sparkles className="inline-block size-12   text-purple-500  "/>
                
                 <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
                    <div className='font-display font-semibold text-3xl'>
                        24/7
                    </div>
                    <div className="feature-main-text">
                    <h3 className='font-medium text-black text-base pb-2'>Instant AI Explainatons:</h3>
                 <p className="text-sm text-text-secondary">
   Highlight any text and get clear explanations without 
   opening a new tab.</p>
                    </div>
              
                </div> 
                
            </div>

            <div className='relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] flex flex-col overflow-hidden'>
        
            <Pen className="inline-block size-10  text-yellow-500 "/>
                 <div className='paragraph-overlay h-full flex flex-col gap-2   rounded-lg  p-2 '>
                    <div className='font-display font-semibold text-7xl'>
                    ∞
                    </div>
                    <div className="feature-main-text">
                    <h3 className='font-medium text-black text-base pb-2'>Smart Highlighting & Notes:</h3>
                 <p className="text-sm text-text-secondary">
                 Capture insights and build your personal study guide 
                 as you read.</p>
                    </div>
              
                </div> 
                
            </div>

            <div className='relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] flex flex-col overflow-hidden'>
        
            <Book className="inline-block size-12  text-blue-500 "/>
        
             <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
                <div className='font-display font-semibold text-3xl'>
                    500K +
                </div>
                <div className="feature-main-text">
                <h3 className='font-medium text-black text-base pb-2'>Built-in Dictionary:</h3>
             <p className="text-sm text-text-secondary">
             Look up definitions instantly—no app switching, no 
   breaking flow.</p>
                </div>
          
            </div> 
            
        </div>

        <div className='relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] flex flex-col overflow-hidden'>
        
       
        <PlaySquare className="inline-block size-12  text-red-500 "/>
         <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
            <div className='font-display font-semibold text-3xl'>
                10K +
            </div>
            <div className="feature-main-text">
            <h3 className='font-medium text-black text-base pb-2'>Curated Video Library:</h3>
         <p className="text-sm text-text-secondary">
         Expert video explanations for every topic—delivered right where you are</p>
            </div>
      
        </div> 
        
    </div>
        {/* <div className='relative bg-gray-200 shadow-inner shadow-white border-2 p-3  rounded-lg backdrop-blur-md  h-[250px] flex flex-col overflow-hidden'>
        
        
    
         <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
            <div className='font-display font-semibold text-3xl'>
                24/7
            </div>
            <div className="feature-main-text">
            <h3 className='font-medium text-black text-base pb-2'></h3>
         <p className="text-sm text-text-secondary">
       </p>
            </div>
      
        </div> 
        
    </div> */}

    
        </div>
    </section>
  )
}

export default Features