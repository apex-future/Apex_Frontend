import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, X, BrainCircuit, BarChart2, Activity } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminSecret');
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'AI Analytics', path: '/ai-analytics', icon: BrainCircuit },
    { name: 'Content & Engagement', path: '/content-analytics', icon: BarChart2 },
    { name: 'Engagement', path: '/engagement', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-md text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl border-r border-slate-800 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Apex Admin
          </h1>
        </div>
        
        <div className="px-6 pt-6 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dashboards</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center px-4 py-3 mb-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-white/20">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Administrator</p>
              <p className="text-xs text-slate-400">admin@apex.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 group-hover:text-rose-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/60 flex items-center px-4 sm:px-8 shadow-sm justify-between md:justify-start sticky top-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mr-4 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 md:hidden transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 capitalize">
                {location.pathname === '/' ? 'Overview' : location.pathname.split('/')[1].replace('-', ' ')}
              </h2>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
