import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Envelope, 
  CheckCircle, 
  XCircle, 
  ArrowCounterClockwise,
  CircleNotch
} from '@phosphor-icons/react';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';
import useAuthStore from '../main_app/store/authStore';

function VerifyEmailPage({ onLogin, userEmail }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const currentUser = useAuthStore((state) => state.user);
  const displayEmail = userEmail || currentUser?.email;

  // STATE A (Resend Cooldown & Status)
  const [cooldown, setCooldown] = useState(0);
  const [justSent, setJustSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');

  // STATE B (Verification Status: 'verifying' | 'success' | 'expired' | 'error')
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const hasVerifiedRef = useRef(false);

  // Redirect verified users to / if they arrive at holding screen (/verify-email)
  useEffect(() => {
    if (!token && currentUser?.is_verified) {
      navigate('/', { replace: true });
    }
  }, [token, currentUser, navigate]);

  // STATE B: Token verification on mount
  useEffect(() => {
    if (!token) return;
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const runVerification = async () => {
      setVerificationStatus('verifying');
      try {
        const response = await authService.verifyEmail(token);
        if (onLogin) {
          onLogin(response);
        }
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } catch (err) {
        const detail = err.response?.data?.detail;
        if (detail === 'verification_link_expired') {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
      }
    };

    runVerification();
  }, [token, onLogin, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setJustSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendError('');
    try {
      await authService.resendVerification();
      setJustSent(true);
      setCooldown(30);
    } catch (err) {
      setResendError(err.response?.data?.detail || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = () => {
    authService.logout();
    useAuthStore.getState().clearUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#0f0f13] text-gray-100 flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-[#7C3AED]/30">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        
        {/* Apex Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 group">
          <img 
            src={logoLight} 
            alt="Apex Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
          />
          <span className="font-bold text-xl tracking-tight text-white">Apex</span>
        </Link>

        {/* STATE B: Token in URL */}
        {token ? (
          <div className="w-full flex flex-col items-center">
            {verificationStatus === 'verifying' && (
              <div className="flex flex-col items-center py-6 animate-fade-in">
                <CircleNotch size={36} className="animate-spin text-[#7C3AED] mb-4" />
                <p className="text-gray-300 text-sm font-medium">Verifying your email...</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                  <CheckCircle size={40} weight="fill" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                  You're verified, Scholar.
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your account is ready. Taking you in...
                </p>
              </div>
            )}

            {verificationStatus === 'expired' && (
              <div className="flex flex-col items-center w-full animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
                  <XCircle size={40} weight="fill" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                  This link has expired
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Verification links expire after 10 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/verify-email')}
                  className="w-full py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-[0.99] cursor-pointer"
                >
                  Get a new link &rarr;
                </button>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="flex flex-col items-center w-full animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
                  <XCircle size={40} weight="fill" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  That link didn't work. Request a new one.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/verify-email')}
                  className="w-full py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-[0.99] cursor-pointer"
                >
                  Try again &rarr;
                </button>
              </div>
            )}
          </div>
        ) : (
          /* STATE A: Holding Screen (No token in URL) */
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Envelope icon, large, purple tint */}
            <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-6 text-[#7C3AED]">
              <Envelope size={32} weight="duotone" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
              Check your email
            </h1>

            {/* Sub-text */}
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              We sent a verification link to{' '}
              {displayEmail ? (
                <span className="text-white font-semibold">{displayEmail}</span>
              ) : (
                'your inbox'
              )}
              . The link expires in 10 minutes.
            </p>

            {/* Info note */}
            <p className="text-xs text-gray-500 mb-8">
              Can't find it? Check your spam folder.
            </p>

            {/* Resend button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm font-medium text-[#A78BFA] hover:text-[#C4B5FD] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {resending ? (
                <>
                  <CircleNotch size={16} className="animate-spin text-[#A78BFA]" />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                justSent ? (
                  <span className="text-emerald-400">Email sent ✓ ({cooldown}s)</span>
                ) : (
                  <span>Resend in {cooldown}s...</span>
                )
              ) : (
                <>
                  <ArrowCounterClockwise size={16} />
                  <span>Resend verification email</span>
                </>
              )}
            </button>

            {/* Resend Error message */}
            {resendError && (
              <p className="text-red-400 text-xs mt-2.5">{resendError}</p>
            )}

            {/* Bottom link */}
            <div className="mt-12 pt-6 border-t border-white/5 w-full text-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              >
                Wrong account? <span className="underline underline-offset-2">Sign out</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default VerifyEmailPage;
