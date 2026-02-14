import { ArrowLeft, Dot, Settings } from 'lucide-react'
import dummyProfileImg from "../../../../../assets/user_imgs/user_img_1.jpg"

function Profile() {
  return (
    <div className='w-full' min-h-screen profile-section>
        <div className="top-wrapper flex flex-col gap-6 h-[50vh] bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
         

            <div className="flex justify-between items-center p-2">
                <ArrowLeft className='text-white'/>
                <h3 className='text-white text-lg font-display'>Profile</h3>
                <Settings className='text-white'/>

            </div>
            <div className="first-content flex item-start gap-2 px-2">
                <img src={dummyProfileImg} alt="" className='size-32 object-cover p-2 rounded-full' />
            <div className="user-info tex-white">
                <h1 className="user-name text-white text-2xl font-display">User</h1>
                <div className="info">
                    <div>
                        <h5>Total Books</h5>
                        <p>100</p>
                    </div>
                    <div>
                        <h5>Completed Books</h5>
                        <p>100</p>
                    </div>
                    <div>
                        <h5>Reading Streak</h5>
                        <p>100</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
        
    </div>
  )
}

export default Profile