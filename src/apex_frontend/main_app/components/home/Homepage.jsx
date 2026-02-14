import Header from "./Header"
import Allbooks from "./Allbooks"
import TopNavBar from "../layout/TopNavBar"
function HomePage({setIsMobileOpen}) {
  return (
    <div className="pt-3">
         <TopNavBar setIsMobileOpen={setIsMobileOpen}/>
        <Header/>
        <Allbooks/>
    </div>
  )
}

export default HomePage