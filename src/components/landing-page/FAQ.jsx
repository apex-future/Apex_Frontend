import { Sparkle } from 'lucide-react'
import {useState} from "react"

function FAQ() {
    let accordionItems =[
        {id:1, question: "What Is Apex?",answer: " Apex is an AI-powered reading platform that keeps everything you need in one place—instant explanations, dictionary lookups, and curated videos. No more tab switching, just focused studying."},
        {id:2, question:"Is Apex free to use?", answer:"Yes! Apex offers a free plan with core features. We also have premium plans with advanced tools like extra credits etc."},
        {id:3, question:"What file formats can I upload?", answer:"You can upload PDFs and paste text directly into Apex. We're working on adding support for more formats like ePub and Word documents soon."},
        {id:4, question:"Does the AI explanation feature require internet?", answer:"Yes, AI explanations need an internet connection. However, you can read your uploaded documents and access saved highlights offline."},
        {id:5, question:"Can I use Apex for exam preparation?", answer:"Absolutely! Apex is designed for students preparing for JAMB, WAEC, university exams, and more. You can read materials, get AI help, and (coming soon) practice with real exam questions."}]
    let [activeId,setActiveId]=useState(null);
    let toggleAccordion= (id)=>{
        setActiveId((currentId)=>{
            //this creates a toggle effect; if the currently clicked id is active , make it not active
            return currentId===id? null: id
        })
    }
  return (
    <section className='pt-14 '>
        <h2 className="FAQ-heading text-3xl font-semibold font-display p-2 px-4 ">
            Frequently Asked Question
        </h2>
        <div className="FAQ-wrapper w-[80%] mx-auto mt-5 grid grid-cols-1 gap-3">
           { accordionItems.map((item)=>(
                    <article className='flex flex-col  p-3 rounded-lg  divide-y divide-black gap-3 bg-gray-200 shadow-inner shadow-white border-2' key={item.id}>
                    <div className='flex justify-between '>
                        <h5 className="FAQ-question font-medium">{item.question}</h5>
                        <button onClick={()=>{toggleAccordion(item.id)}} >
                        <Sparkle className={` transition-all duration-200 ${activeId===item.id?"text-purple-500":""}`} />
                        </button>
                        
                    </div>
                    <div className={`FAQ-answer p-2 transition-all ease-in duration-200 leading-relaxed ${activeId===item.id?"block":"hidden"}`}>
                        <p>{item.answer}</p>
                    </div>
                    </article>

           ))}
        
            
        </div>
    </section>
  )
}

export default FAQ