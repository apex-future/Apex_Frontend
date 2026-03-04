import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserCircle } from 'lucide-react';
import logoLight from "../../assets/logo/logo-light.jpg";

function SignupPage({ onLogin }) {
  const navigate = useNavigate();

  const handleStart = () => {
    onLogin();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <img src={logoLight} alt="Apex Logo" className="w-14 h-14 rounded-2xl mb-4 shadow-xl shadow-accent-primary/10" />
          <h2 className="text-white text-3xl font-bold font-display tracking-tight">Apex <span className="text-accent-primary">AI</span></h2>
          <p className="text-neutral-400 mt-2 text-sm">Your academic breakthrough companion</p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/10 flex flex-col items-center">
          <div className="w-20 h-20 bg-accent-subtle rounded-3xl flex items-center justify-center text-accent-primary mb-8 animate-bounce-slow">
            <UserCircle size={44} strokeWidth={1.5} />
          </div>

          <h3 className="text-2xl font-bold text-neutral-900 mb-2 font-display">Ready to Begin?</h3>
          <p className="text-neutral-500 text-center text-sm mb-10 leading-relaxed">
            Skip the registration and dive straight into your personalized library as a guest.
          </p>

          <button
            onClick={handleStart}
            className="group w-full px-4 !py-4.5 h-12 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95"
          >
            Start as Guest
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-8 flex items-center gap-2 text-neutral-400">
            <Sparkles size={14} className="text-accent-primary" />
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400/60">Fast Access Mode</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-neutral-500 text-sm">
          Interested in a private account? <a href="/#cta" className="text-white hover:text-accent-primary transition-colors font-medium">Join the waitlist</a>
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}

export default SignupPage;
