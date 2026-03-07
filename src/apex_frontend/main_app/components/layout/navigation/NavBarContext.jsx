//create a context API so other components can close and open nav bar
import React from 'react'
import { NavBarContext } from './NavBarContextInstance'
function NavBarProvider({ children, asideToggleFunctions }) {
  return (
    <NavBarContext.Provider value={asideToggleFunctions}>
      {children}
    </NavBarContext.Provider>
  )
}

export default NavBarProvider
