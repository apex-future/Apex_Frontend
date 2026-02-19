import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

function WaitlistForm() {
  const [email, setEmail] = useState('');
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
      // Using the specific Render API provided by the user
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
        const detail = data.detail;
        const errMsg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail) && detail[0]?.msg
            ? detail[0].msg
            : 'Something went wrong. Please try again.';
        setMessage(errMsg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('A network issue prevented your request. Please check your connection.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 w-full max-w-xl mx-auto group z-20'
        aria-labelledby="waitlist-heading"
      >
        {/* Subtle Inner Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 text-accent-primary">
            <Lock size={24} />
          </div>
          <h3 id="waitlist-heading" className='font-display text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight'>
            Request Access
          </h3>
          <p className='font-sans text-white/50 text-sm sm:text-base text-center max-w-[280px] leading-relaxed uppercase tracking-widest font-bold'>
            Limited slots for Founding Scholars
          </p>
        </div>

        {/* Email Input */}
        <div className='relative mb-6'>
          <label htmlFor="waitlist-email" className='sr-only'>Email address</label>
          <input
            type="email"
            id="waitlist-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="institution@email.com"
            required
            disabled={status === 'loading'}
            className='w-full px-6 py-5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 rounded-2xl focus:border-accent-primary/50 transition-all disabled:opacity-50 font-medium'
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="group relative w-full py-5 rounded-2xl bg-white text-black font-black text-lg uppercase tracking-[0.2em] transition-all hover:bg-accent-primary hover:text-white active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3 overflow-hidden shadow-2xl shadow-white/5"
        >
          {status === 'loading' ? (
            <span className='flex items-center gap-3'>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            <>
              Submit Request
              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </button>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className='text-white/30 text-[10px] uppercase font-black tracking-[0.3em]'>
            Secure 256-bit Encryption
          </p>
        </div>
      </form>

      {/* Toast Portal */}
      {showToast && createPortal(
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md animate-slide-up">
          <div className={`p-6 rounded-3xl backdrop-blur-2xl border flex items-center gap-4 shadow-2xl ${status === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            {status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <p className="font-bold text-sm leading-tight flex-1">
              {message}
            </p>
            <button onClick={() => setShowToast(false)} className="opacity-50 hover:opacity-100 transition-opacity">
              <CheckCircle2 size={20} className="rotate-45" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default WaitlistForm;