import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Backend API URL: use VITE_API_URL in .env or default to local dev server
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
      const response = await fetch(`https://apex-waitlist-api.onrender.com/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
      }

      if (response.ok) {
        setStatus('success');
        setMessage("🎉 You're on the list! Check your email for updates.");
        setEmail('');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } else {
        setStatus('error');
        // FastAPI returns detail as string or array of { msg }
        const detail = data.detail;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail) && detail[0]?.msg
              ? detail[0].msg
              : response.status === 503 || response.status === 502 || response.status === 504
                ? 'A network issue prevented your request. Please check your connection and try again.'
                : response.status === 404 || response.status === 0
                  ? 'A network issue prevented connecting. Please check your connection and try again.'
                  : 'Something went wrong. Please try again.';
        setMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        'A network issue prevented your request. Please check your connection and try again.'
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='bg-black/30 relative backdrop-blur-md shadow-lg border border-[rgba(94,94,94,0.5)] rounded-lg p-6 z-[20] sm:p-8 w-full mx-auto'
        aria-labelledby="waitlist-heading"
      >
        {/* Heading */}
        <h3
          id="waitlist-heading"
          className='font-display text-2xl md:text-3xl font-bold text-white mb-2 text-center'
        >
          Grab A Spot
        </h3>

        {/* Subtext */}
        <p className='font-sans text-white/80 text-sm mb-6 text-center'>
          Be first to experience focused studying with Apex
        </p>

        {/* Email Input */}
        <div className='mb-4'>
          <label htmlFor="waitlist-email" className='sr-only'>
            Email address
          </label>
          <input
            type="email"
            id="waitlist-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === 'loading'}
            className='w-full px-4 py-3  bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-full focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            autoComplete="email"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="w-full py-3   rounded-full bg-accent-primary hover:bg-accent-hover text-white font-display font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-black/30"
        >
          {status === 'loading' ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining...
            </span>
          ) : status === 'success' ? (
            '✓ Joined!'
          ) : (
            'Join Waitlist'
          )}
        </button>

        {/* Privacy Notice */}
        <p className='font-sans text-white/60 text-xs mt-4 text-center'>
          We respect your privacy. No spam, ever.
        </p>
      </form>

      {/* Toast Portal - Renders outside form */}
      {showToast && createPortal(
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up ${status === 'success'
              ? 'bg-success text-white'
              : 'bg-error text-white'
            } px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-lg w-[80%]`}
        >
          {/* Icon */}
          <span className='text-2xl'>
            {status === 'success' ? '✓' : '⚠'}
          </span>

          {/* Message */}
          <p className='font-sans text-sm font-medium flex-1'>
            {message}
          </p>

          {/* Close Button */}
          <button
            onClick={() => setShowToast(false)}
            className='hover:opacity-70 transition-opacity'
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default WaitlistForm;