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
      if (response?.user && (response.user.is_verified === false || response.user.is_verified === null || !response.user.is_verified)) {
        navigate('/verify-email');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      if (detail === 'google_account') {
        setError('google_account');
      } else {
        setError(detail || 'Invalid email or password. Please try again.');
      }
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
          {error === 'google_account' ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-[10px] mb-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold">This account was created with Google</p>
                  <p className="text-xs text-blue-600 mt-0.5">Use <strong>"Continue with Google"</strong> below to log in.</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[6px] flex items-center gap-2 mb-4">
              <WarningCircle size={18} weight="regular" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : null}

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
