import { Menu, Search, Plus } from 'lucide-react'
import logo from "../../../../../assets/logo/logo-light-removebg-preview.png";

function TopNavBar({ setIsMobileOpen, onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (onUpload) {
      onUpload(file);
      e.target.value = '';
    }
  };
  return (
    <nav className='w-full p-2'>
      <div className="nav-wrapper flex justify-between w-full p-0 md:p-1 items-center gap-3">

        {/* Mobile Menu Button - Only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden z-40 p-2 rounded-lg hover:bg-bg-subtle transition-all"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-text-primary" />
        </button>

        {/* Search Bar - Glassmorphic with Thick Border */}
        {/* Search Bar - Responsive */}
        <form className="search-bar flex justify-end md:justify-center items-center gap-2 w-full md:max-w-2xl mx-auto flex-1">
          <div className="relative w-full flex items-center bg-white/60 backdrop-blur-md border-2 border-border-default rounded-full hover:border-text-tertiary focus-within:border-accent-primary transition-all">
            <Search className='absolute left-3 md:left-4 text-text-tertiary pointer-events-none' size={18} />
            <input
              type="text"
              className="w-full pl-10 md:pl-11 pr-4 py-2 md:py-2.5 rounded-full placeholder:text-sm placeholder:text-text-placeholder focus:outline-none bg-transparent text-text-primary text-sm md:text-base"
              placeholder='Search books...'
            />
          </div>
        </form>

        {/* Upload & Logo Group */}
        <div className="flex items-center gap-3 ">
          {/* Upload Button - Responsive */}
          <div className="md:flex hidden items-center h-full">
            <input
              type="file"
              id="top-nav-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.epub"
            />
            <label
              htmlFor="top-nav-upload"
              className="flex items-center justify-center gap-2 px-2.5 md:px-4 py-2.5 bg-accent-primary hover:bg-accent-hover text-white rounded-full transition-all cursor-pointer shadow-sm md:w-auto"
            >
              <Plus size={18} />
              <span className="hidden md:inline text-sm font-medium">Upload</span>
            </label>
          </div>

          <div className="logo-wrapper h-full">
            <img
              src={logo}
              alt="Apex Logo"
              className='size-10 rounded-full object-cover'
            />
          </div>
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar