//create a context API so other components can close and open nav bar
import React from 'react'
import { createContext } from 'react'
export const NavBarContext = createContext()
function NavBarProvider ({children,asideToggleFunctions}) {
  return (
    <NavBarContext.Provider value={asideToggleFunctions}>
        {children}
    </NavBarContext.Provider>
  )
}

export default NavBarProvider
