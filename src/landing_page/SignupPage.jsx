import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';
import FloatingLines from './components/ui/FloatingLines';

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.register(fullName, email, password);
      onLogin(response);
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <FloatingLines 
          enabledWaves={["top","middle","bottom"]}
          lineCount={5}
          lineDistance={5}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
        />
      </div>

      <div className="w-full max-w-md lg:max-w-5xl lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-20 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center lg:items-start mb-10 lg:mb-0 lg:max-w-sm">
          <Link to="/">
            <img src={logoLight} alt="Apex Logo" className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] mb-6 shadow-2xl shadow-purple-500/20" />
          </Link>
          <h2 className="text-white text-3xl lg:text-5xl font-bold font-display tracking-tight text-center lg:text-left leading-tight">Create your<br className="hidden lg:block" /> Account</h2>
          <p className="text-neutral-400 mt-4 text-sm lg:text-lg text-center lg:text-left">Join the next generation of focused learners and master your craft.</p>
        </div>

        {/* Signup Form Card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/20 relative z-10">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-neutral-300 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

       

          <div className="mt-6 pt-6 border-t border-white/20 text-center">
            <p className="text-white/70 text-sm font-medium">
              Already have an account? <Link to="/login" className="text-white hover:underline font-bold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}} />
    </div>
  );
}

export default SignupPage;
