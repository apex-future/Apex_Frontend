import React from 'react'

function Features() {
  return (
    <section className='fetaures-section pt-12 '>
        <header>
            <h2 className='text-3xl font-semibold p-2 px-4'>Four Ways <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> Apex </span> keeps you focused</h2>
        </header>

        <div className="feature-list grid md:grid-col-2 w-[90%] mx-auto mt-5">
            <div className='h-20 bg-bg-primary rounded-lg border flex flex-col'>
                {/* <img src={null} ></img> */}
                <div className='paragraph-overlay bg-linear-to-t from-gray-500 to-white'>
                    <p></p>
                </div>
                
            </div>
            <div>

            </div>
            <div>

            </div>
            <div>

            </div>
        </div>
    </section>
  )
}

export default Features