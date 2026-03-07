import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lock, Send, CheckCircle2, AlertCircle, User, Mail } from 'lucide-react';
import student1 from '../../../assets/students/student1.jpg';
import student2 from '../../../assets/students/student2.jpg';
import student3 from '../../../assets/students/student3.jpg';
import authService from '../../../services/authService';

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
        ease: "power2.out",
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
      setMessage("🎉 Account created successfully! Redirecting...");
      setShowToast(true);
      
      // Delay to show success message before redirecting
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
    <div className='flex flex-col gap-4' id="signup-section" role="region" aria-labelledby="signup-social-heading">
      <h2 id="signup-social-heading" className="sr-only">Sign Up and Social Proof</h2>
     {/*Social Proof*/}
        <div className="flex flex-row gap-4 justify-center items-center ">
          <div className="flex -space-x-3 overflow-hidden" aria-label="Profiles of Founding Scholars">
            <img
              className="inline-block h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
              src={student1}
              alt="Founding Scholar Profile 1"
              loading="lazy"
            />
            <img
              className="inline-block h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
              src={student2}
              alt="Founding Scholar Profile 2"
              loading="lazy"
            />
            <img
              className="inline-block h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
              src={student3}
              alt="Founding Scholar Profile 3"
              loading="lazy"
            />
          </div>
          <p className="text-white/80 text-sm font-medium">
            50+ Founding Scholars and growing
          </p>
        </div>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='bg-black/30 relative backdrop-blur-md shadow-lg border border-[rgba(94,94,94,0.5)] rounded-2xl p-4  z-[20] sm:p-8 w-full mx-auto'
        aria-labelledby="signup-heading"
      >
        {/* Subtle Inner Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" aria-hidden="true" />

        {/* Heading */}
        <h3
          id="signup-heading"
          className='font-display text-2xl sm:text-3xl font-bold text-white mb-2 text-center leading-tight'
        >
          Join the Future of Learning
        </h3>

        {/* Subtext */}
        <p className='font-sans text-white/80 text-sm mb-6 sm:text-base text-center leading-relaxed'>
          Create your account and start your journey with Apex
        </p>

        {/* Full Name Input */}
        <div className='mb-4'>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50">
              <User size={18} />
            </div>
            <input
              type="text"
              id="signup-name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
              aria-required="true"
              disabled={status === 'loading'}
              className='w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-full focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Input */}
        <div className='mb-4'>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50">
              <Mail size={18} />
            </div>
            <input
              type="email"
              id="signup-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              aria-required="true"
              disabled={status === 'loading'}
              className='w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-full focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className='mb-6'>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50">
              <Lock size={18} />
            </div>
            <input
              type="password"
              id="signup-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              aria-required="true"
              disabled={status === 'loading'}
              className='w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-full focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email || !password || !fullName}
          aria-busy={status === 'loading'}
          className="w-full py-4 rounded-full bg-accent-primary hover:bg-accent-hover text-white font-display font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-black/30 shadow-lg shadow-accent-primary/20"
        >
          {status === 'loading' ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : status === 'success' ? (
            '✓ Success!'
          ) : (
            'Get Instant Access'
          )}
        </button>
      </form>

      {/* Toast Portal - Renders outside form */}
      {showToast && createPortal(
        <div
          role="alert"
          aria-live="assertive"
          id={status === 'error' ? 'signup-error' : 'signup-success'}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up ${status === 'success'
            ? 'bg-success text-white'
            : 'bg-error text-white'
            } px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-lg w-[80%]`}
        >
          {/* Icon */}
          <span className='text-2xl' aria-hidden="true">
            {status === 'success' ? '✓' : '⚠'}
          </span>

          {/* Message */}
          <p className='font-sans text-sm font-medium flex-1'>
            {message}
          </p>

          {/* Close Button */}
          <button
            onClick={() => setShowToast(false)}
            className='hover:opacity-70 transition-opacity p-2'
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
