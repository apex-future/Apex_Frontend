import React from 'react'
 import atomicHabits from "../../../assets/Books/Atomic-habits.jpeg";
import biology from "../../../assets/Books/biology.jpeg";
import physics from "../../../assets/Books/physics.jpeg";

import searchIcon from "../../../assets/icons/search.png";
import profileIcon from "../../../assets/icons/profile.png";
import torchIcon from "../../../assets/icons/torch.png";
import logo from "../../../assets/logo/logo-light.jpg";
import heroImg from "../../../assets/e-book-dashboard.jpg";

export default function Header() {
    return (
        <div>
        <div className="flex flex-row justify-between items-center">
            <div>
                <img className="w-20 h-20 mx-12 md:mx-8" src={logo} alt="" />
            </div>
            <div className="flex flex-row gap-4 justify-end md:mx-10 ">
                <img className="w-10 h-10" src={searchIcon} alt="search-icon" />
                <img className="w-10 h-10" src={torchIcon} alt="torch-icon" />
                 <img className="w-10 h-10" src={profileIcon} alt="profile-icon" />
            </div>
            
        </div>
        </div>
    )
}