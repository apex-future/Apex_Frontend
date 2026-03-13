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

  // Step system
  const [step, setStep] = useState(1);

  // Onboarding fields
  const [userType, setUserType] = useState('');
  const [studyingFor, setStudyingFor] = useState([]);
  const [examDate, setExamDate] = useState({ month: '', year: '' });
  const [studyDevice, setStudyDevice] = useState('');

  const handleNext = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSignup = async () => {
    if (!userType) return; // Field 1 required
    setLoading(true);
    setError('');

    const onboardingData = {
      user_type: userType,
      ...(studyingFor.length > 0 && { studying_for: studyingFor }),
      ...(examDate.month && examDate.year && { 
        exam_date: `${examDate.month} ${examDate.year}` 
      }),
      ...(studyDevice && { study_device: studyDevice }),
    };

    try {
      const response = await authService.register(
        fullName, email, password, onboardingData
      );
      onLogin(response);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      // On error, go back to step 1 so user can fix details
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudyingFor = (item) => {
    if (item === 'Not studying for anything right now') {
      setStudyingFor(['Not studying for anything right now']);
    } else {
      setStudyingFor((prev) => {
        const filtered = prev.filter((s) => s !== 'Not studying for anything right now');
        if (filtered.includes(item)) {
          return filtered.filter((s) => s !== item);
        }
        return [...filtered, item];
      });
    }
  };

  const showStudyingFor = userType === 'student' || userType === 'both';
  const showExamDate = studyingFor.includes('JAMB') || studyingFor.includes('WAEC') || studyingFor.includes('University Exams');

  const ProgressBar = () => (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${step >= 1 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
        <div className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${step >= 2 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
      </div>
      <p className="text-white/40 text-xs text-center mt-1">Step {step} of 2</p>
    </div>
  );

  const Pill = ({ label, selected, onClick, ariaPressed }) => (
    <button
      type="button"
      role="button"
      aria-pressed={ariaPressed !== undefined ? ariaPressed : selected}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
        selected
          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
          : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/15'
      }`}
    >
      {label}
    </button>
  );

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
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/20 relative z-10 transition-all duration-500">
          <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-5">
                <ProgressBar />

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
                  className="group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4"
                >
                  Next
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <button 
                  onClick={() => setStep(1)}
                  className="text-white/40 text-xs hover:text-white/70 transition-colors cursor-pointer block mb-2"
                >
                  ← Back
                </button>
                
                <p className="text-white/60 text-sm text-center">✦ Let's personalize Apex for you</p>
                
                <ProgressBar />

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    What describes you best? <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'student', label: 'Student' },
                      { value: 'casual_reader', label: 'Casual Reader' },
                      { value: 'both', label: 'Both' },
                    ].map((type) => (
                      <Pill
                        key={type.value}
                        label={type.label}
                        selected={userType === type.value}
                        onClick={() => setUserType(type.value)}
                      />
                    ))}
                  </div>
                </div>

                {showStudyingFor && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-white/40 text-xs font-normal">
                      What are you studying for? (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['JAMB', 'WAEC', 'University Exams', 'Professional Cert', 'Not studying for anything right now'].map((item) => (
                        <Pill
                          key={item}
                          label={item}
                          selected={studyingFor.includes(item)}
                          onClick={() => toggleStudyingFor(item)}
                          ariaPressed={studyingFor.includes(item)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {showExamDate && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-white/40 text-xs font-normal">
                      When is your exam? (optional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={examDate.month}
                        onChange={(e) => setExamDate({ ...examDate, month: e.target.value })}
                        className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-white/50 bg-neutral-900">Month</option>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                          <option key={m} value={m} className="bg-neutral-900">{m}</option>
                        ))}
                      </select>
                      <select
                        value={examDate.year}
                        onChange={(e) => setExamDate({ ...examDate, year: e.target.value })}
                        className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-white/50 bg-neutral-900">Year</option>
                        {[2026, 2027, 2028, 2029].map(y => (
                          <option key={y} value={y} className="bg-neutral-900">{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <label className="text-white/40 text-xs font-normal">
                    How do you currently study? (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['phone', 'laptop', 'both'].map((device) => (
                      <Pill
                        key={device}
                        label={device.charAt(0).toUpperCase() + device.slice(1)}
                        selected={studyDevice === device}
                        onClick={() => setStudyDevice(studyDevice === device ? '' : device)}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={!userType || loading}
                  className={`group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4 ${(!userType || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              </div>
            )}
          </div>

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
