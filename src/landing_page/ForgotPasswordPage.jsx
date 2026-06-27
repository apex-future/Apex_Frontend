import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import logoLight from '../assets/logo/logo-light.jpg';
import authService from '../main_app/services/authService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
      style={{ background: 'radial-gradient(circle at 50% 50%, #161a29 0%, #0f111a 100%)' }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md lg:max-w-5xl lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-20 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Brand Header */}
        <div className="flex flex-col items-center lg:items-start mb-10 lg:mb-0 lg:max-w-sm">
          <Link to="/">
            <img
              src={logoLight}
              alt="Apex Logo"
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] mb-6 shadow-2xl shadow-purple-500/20"
            />
          </Link>
          <h2 className="text-white text-3xl lg:text-5xl font-bold font-display tracking-tight text-center lg:text-left leading-tight">
            Forgot<br className="hidden lg:block" /> Password
          </h2>
          <p className="text-neutral-400 mt-4 text-sm lg:text-lg text-center lg:text-left">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/20 relative z-10">

          {submitted ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                <CheckCircle size={36} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white text-2xl font-bold mb-2">Check your inbox</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  We sent a reset link to <span className="text-white font-semibold">{email}</span>.<br />
                  It expires in 30 minutes.
                </p>
              </div>
              <p className="text-white/40 text-xs">
                Didn't get it? Check your spam folder.
              </p>
              <Link
                to="/login"
                className="mt-2 w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle size={18} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/90 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-neutral-300 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {!submitted && (
            <div className="mt-8 pt-8 border-t border-white/20 text-center">
              <p className="text-white/70 text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-white hover:underline font-bold">
                  Sign in
                </Link>
              </p>
            </div>
          )}
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

export default ForgotPasswordPage;
