import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lock, User, EnvelopeSimple } from '@phosphor-icons/react';
import authService from '../../main_app/services/authService';

gsap.registerPlugin(ScrollTrigger);

function WaitlistForm({ onLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const formRef = useRef(null);

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.fromTo(
      formRef.current,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "apple",
        scrollTrigger: {
          trigger: formRef.current,
          start: "top 85%",
          toggleActions: "play none none play"
        }
      }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await authService.register(fullName, email, password);
      setStatus('success');
      setMessage("Account created successfully! Redirecting...");
      setShowToast(true);
      
      setTimeout(() => {
        if (onLogin) onLogin();
      }, 1500);
      
    } catch (err) {
      setStatus('error');
      const detail = err.response?.data?.detail;
      const errMsg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : 'Something went wrong. Please try again.';
      setMessage(errMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <div className='flex flex-col gap-4' id="signup-section" role="region" aria-labelledby="signup-heading">
      
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='aura-card p-6 sm:p-8 w-full mx-auto relative overflow-hidden'
        aria-labelledby="signup-heading"
      >
        <h3
          id="signup-heading"
          className='font-display text-2xl font-bold text-text-primary mb-2 text-center'
        >
          Create your account
        </h3>
        <p className='font-sans text-text-secondary text-sm mb-8 text-center'>
          Join Apex and transform your reading workflow today.
        </p>

        {/* Full Name Input */}
        <div className='mb-4 relative'>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-placeholder">
            <User size={18} weight="regular" />
          </div>
          <input
            type="text"
            id="signup-name"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            required
            disabled={status === 'loading'}
            className='aura-input w-full pl-11 pr-4 py-3 text-sm'
            autoComplete="name"
          />
        </div>

        {/* Email Input */}
        <div className='mb-4 relative'>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-placeholder">
            <EnvelopeSimple size={18} weight="regular" />
          </div>
          <input
            type="email"
            id="signup-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="Email address"
            required
            disabled={status === 'loading'}
            className='aura-input w-full pl-11 pr-4 py-3 text-sm'
            autoComplete="email"
          />
        </div>

        {/* Password Input */}
        <div className='mb-8 relative'>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-placeholder">
            <Lock size={18} weight="regular" />
          </div>
          <input
            type="password"
            id="signup-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={status === 'loading'}
            className='aura-input w-full pl-11 pr-4 py-3 text-sm'
            autoComplete="new-password"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email || !password || !fullName}
          aria-busy={status === 'loading'}
          className="aura-btn-primary w-full py-4 text-base shadow-aura-sm"
        >
          {status === 'loading' ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : status === 'success' ? (
            '✓ Success!'
          ) : (
            'Start learning'
          )}
        </button>
      </form>

      {/* Toast Portal */}
      {showToast && createPortal(
        <div
          role="alert"
          aria-live="assertive"
          id={status === 'error' ? 'signup-error' : 'signup-success'}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up ${status === 'success'
            ? 'bg-success text-white'
            : 'bg-error text-white'
            } px-6 py-4 rounded-lg shadow-aura-lg flex items-center gap-3 max-w-md w-[90%]`}
        >
          <span className='text-xl font-bold' aria-hidden="true">
            {status === 'success' ? '✓' : '⚠'}
          </span>
          <p className='font-sans text-sm font-medium flex-1'>
            {message}
          </p>
          <button
            onClick={() => setShowToast(false)}
            className='hover:opacity-70 transition-opacity p-2'
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default WaitlistForm;
