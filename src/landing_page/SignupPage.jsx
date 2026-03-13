import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';
import FloatingLines from './components/ui/FloatingLines';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear + i);

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step system
  const [step, setStep] = useState(1);
  const [stepLoading, setStepLoading] = useState(false);

  // Onboarding fields
  const [userType, setUserType] = useState('');
  const [studyingFor, setStudyingFor] = useState([]);
  const [examDate, setExamDate] = useState('');
  const [studyDevice, setStudyDevice] = useState('');

  // Exam date parts
  const [examMonth, setExamMonth] = useState('');
  const [examYear, setExamYear] = useState('');

  const handleNext = async (e) => {
    e.preventDefault();
    setStepLoading(true);
    setError('');
    try {
      const response = await authService.register(fullName, email, password);
      // Store token immediately so step 2 API call is authenticated
      onLogin(response);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const handleDone = async () => {
    if (!userType) return; // Field 1 is required
    setStepLoading(true);
    try {
      // Build exam date string from month + year
      const computedExamDate = examMonth && examYear ? `${examMonth} ${examYear}` : null;

      await authService.saveOnboarding({
        user_type: userType,
        studying_for: studyingFor.length > 0 ? studyingFor : null,
        exam_date: computedExamDate,
        study_device: studyDevice || null,
      });
    } catch (err) {
      console.error('Onboarding save failed:', err);
      // Non-blocking — don't show error, just proceed
    } finally {
      setStepLoading(false);
      navigate('/');
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

  // Progress bar component
  const ProgressBar = () => (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
      </div>
      <p className="text-white/50 text-xs mt-2 text-center">Step {step} of 2</p>
    </div>
  );

  // Pill toggle component
  const Pill = ({ label, selected, onClick, ariaPressed }) => (
    <button
      type="button"
      role="button"
      aria-pressed={ariaPressed !== undefined ? ariaPressed : selected}
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
        selected
          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
          : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
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
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/20 relative z-10">
          
          {/* Step 1 */}
          {step === 1 && (
            <div key="step1" className="animate-in fade-in slide-in-from-right-4 duration-400">
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
                  disabled={stepLoading}
                  className="group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-neutral-300 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4"
                >
                  {stepLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Next
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 2 — Onboarding */}
          {step === 2 && (
            <div key="step2" className="animate-in fade-in slide-in-from-right-4 duration-400">
              <div className="space-y-5">
                {/* Subtle header */}
                <p className="text-white/70 text-sm text-center">✦ Let's personalize Apex for you</p>

                <ProgressBar />

                {/* Field 1 — What describes you best? (required) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">
                    What describes you best? <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['student', 'casual reader', 'both'].map((type) => (
                      <Pill
                        key={type}
                        label={type.charAt(0).toUpperCase() + type.slice(1)}
                        selected={userType === type}
                        onClick={() => setUserType(type)}
                      />
                    ))}
                  </div>
                </div>

                {/* Field 2 — What are you studying for? (optional, conditional) */}
                {showStudyingFor && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">
                      What are you studying for? <span className="text-white/40 text-xs font-normal ml-1">(optional)</span>
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

                {/* Field 3 — When is your exam? (optional, conditional) */}
                {showExamDate && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">
                      When is your exam? <span className="text-white/40 text-xs font-normal ml-1">(optional)</span>
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={examMonth}
                        onChange={(e) => {
                          setExamMonth(e.target.value);
                          setExamDate(e.target.value && examYear ? `${e.target.value} ${examYear}` : '');
                        }}
                        className="flex-1 px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1a1a2e] text-white">Month</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m} className="bg-[#1a1a2e] text-white">{m}</option>
                        ))}
                      </select>
                      <select
                        value={examYear}
                        onChange={(e) => {
                          setExamYear(e.target.value);
                          setExamDate(examMonth && e.target.value ? `${examMonth} ${e.target.value}` : '');
                        }}
                        className="flex-1 px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all backdrop-blur-md appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1a1a2e] text-white">Year</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y} className="bg-[#1a1a2e] text-white">{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Field 4 — How do you currently study? (optional, always visible) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">
                    How do you currently study? <span className="text-white/40 text-xs font-normal ml-1">(optional)</span>
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

                {/* Done button */}
                <button
                  type="button"
                  onClick={handleDone}
                  disabled={!userType || stepLoading}
                  aria-disabled={!userType}
                  className={`group w-full h-14 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 active:scale-95 mt-4 ${
                    userType
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-purple-500/20 cursor-pointer'
                      : 'bg-white/10 text-white/30 shadow-none cursor-not-allowed'
                  }`}
                >
                  {stepLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Done
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* "Already have an account?" link — only on step 1 */}
          {step === 1 && (
            <div className="mt-6 pt-6 border-t border-white/20 text-center">
              <p className="text-white/70 text-sm font-medium">
                Already have an account? <Link to="/login" className="text-white hover:underline font-bold">Sign in</Link>
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

export default SignupPage;
