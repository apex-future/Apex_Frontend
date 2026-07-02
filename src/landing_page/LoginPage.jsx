import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WarningCircle, Eye, EyeClosed } from '@phosphor-icons/react';
import { Lock, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.googleAuth(credentialResponse.credential);
      onLogin(response);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed. Please try again.');
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
              <WarningCircle size={18} weight="regular" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mb-4 relative">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="w-full px-5 py-3.5 border border-[#D1D5DB] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-colors"
              required
            />
          </div>

            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#7C3AED] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7C3AED] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-[#D1D5DB] rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 disabled:bg-black/50 disabled:cursor-not-allowed text-white py-3.5 rounded-full font-medium text-[15px] transition-colors flex items-center justify-center gap-2"
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
            Don't have an account? <Link to="/signup" className="text-[#7C3AED] hover:underline">Sign up</Link>
          </p>
        </div>

        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-[#D1D5DB]"></div>
          <span className="px-4 text-[12px] text-gray-500 bg-white tracking-widest uppercase">OR</span>
          <div className="flex-grow border-t border-[#D1D5DB]"></div>
        </div>

        <div className="w-full space-y-3 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google authentication failed.')}
            shape="pill"
            size="large"
            text="continue_with"
            width="320"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
