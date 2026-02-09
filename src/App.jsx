 import React from 'react'
 import MainApp from './apex_frontend/main_app/MainApp'
 import LandingPage from './apex_frontend/landing_page/LandingPage'
 import {useState} from "react"
 function App() {
    //form a placeholder backend signing functionality
    let [isLoggedIn,setIsLoggedIn] =useState(false)
   return (
     <div className=' h-screen'>
      {/* when the user see if not logged in */}
       {!isLoggedIn && <LandingPage /> }

      {/* when the user see if logged in */}
       {isLoggedIn && <MainApp />}
     </div>
   
   )
 }
 
 export default App