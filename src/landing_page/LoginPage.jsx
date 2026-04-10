import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password);
      onLogin(response);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans p-6 text-gray-900">
      <div className="w-full max-w-[320px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <Link to="/">
            <img src={logoLight} alt="Apex Logo" className="w-12 h-12 rounded-xl object-cover" />
          </Link>
        </div>

        <h1 className="text-[32px] font-bold mb-6 text-center tracking-tight text-[#2D333A]">Welcome back</h1>

        <form className="w-full" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[6px] flex items-center gap-2 mb-4">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mb-4 relative">
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="w-full px-4 py-3.5 border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent text-base transition-colors"
              required
            />
          </div>

          <div className="mb-4 relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent text-base transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 disabled:bg-black/50 disabled:cursor-not-allowed text-white py-3.5 rounded-[6px] font-medium text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="w-full mb-6 mt-4 text-center">
          <p className="text-[14px] text-gray-600">
            Don't have an account? <Link to="/signup" className="text-[#10a37f] hover:underline">Sign up</Link>
          </p>
        </div>

        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-[#D1D5DB]"></div>
          <span className="px-4 text-[12px] text-gray-500 bg-white tracking-widest uppercase">OR</span>
          <div className="flex-grow border-t border-[#D1D5DB]"></div>
        </div>

        <div className="w-full space-y-3">
          <button type="button" className="w-full flex items-center bg-white border border-[#D1D5DB] rounded-[6px] py-3.5 hover:bg-gray-50 transition-colors px-4 relative">
            <svg className="w-[18px] h-[18px] absolute left-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="flex-1 text-center text-[#2D333A] font-medium text-[15px]">Continue with Google</span>
          </button>
          

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
