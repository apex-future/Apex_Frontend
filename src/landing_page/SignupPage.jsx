import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WarningCircle, Eye, EyeClosed, ArrowRight } from '@phosphor-icons/react';
import { GoogleLogin } from '@react-oauth/google';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      setStep(1);
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

  const Pill = ({ label, selected, onClick, ariaPressed }) => (
    <button
      type="button"
      role="button"
      aria-pressed={ariaPressed !== undefined ? ariaPressed : selected}
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-all ${
        selected
          ? 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]'
          : 'bg-white text-gray-700 border-[#D1D5DB] hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans p-6 text-gray-900">
      <div className="w-full max-w-[320px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <Link to="/">
            <img src={logoLight} alt="Apex Logo" className="w-12 h-12 rounded-xl object-cover" />
          </Link>
        </div>

        <h1 className="text-[32px] font-bold mb-6 text-center tracking-tight text-[#2D333A] leading-tight">
          {step === 1 ? 'Create your account' : 'Personalize your info'}
        </h1>

        {error && (
          <div className="w-full bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[6px] flex items-center gap-2 mb-4">
            <WarningCircle size={18} weight="regular" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form className="w-full" onSubmit={handleNext}>
            <div className="mb-4 relative">
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <input 
                id="fullName"
                type="text" 
                placeholder="Full Name"
                aria-label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-5 py-3.5 border border-[#D1D5DB] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-colors"
                required
              />
            </div>
            
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

            <div className="mb-4 relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-3.5 border border-[#D1D5DB] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-colors"
                required
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeClosed size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
              </button>
            </div>

            <button 
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 rounded-full font-medium text-[15px] transition-colors mt-2"
            >
              Continue
            </button>

            <div className="w-full mb-6 mt-4 text-center">
              <p className="text-[14px] text-gray-600">
                Already have an account? <Link to="/login" className="text-[#7C3AED] hover:underline">Log in</Link>
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
          </form>
        ) : (
          <div className="w-full space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setStep(1)}
              className="text-gray-500 text-sm hover:text-gray-800 transition-colors cursor-pointer block mb-2"
            >
              ← Back
            </button>

            <div className="space-y-2.5">
              <label id="userTypeLabel" className="text-sm font-semibold text-gray-800">
                What describes you best? <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="userTypeLabel">
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
                <label id="studyingForLabel" className="text-sm font-semibold text-gray-800">
                  What are you studying for? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="studyingForLabel">
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
                <label className="text-sm font-semibold text-gray-800">
                  When is your exam? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={examDate.month}
                    onChange={(e) => setExamDate({ ...examDate, month: e.target.value })}
                    className="flex-1 bg-white border border-[#D1D5DB] text-gray-800 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] appearance-none cursor-pointer text-sm"
                  >
                    <option value="" className="text-gray-400">Month</option>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={examDate.year}
                    onChange={(e) => setExamDate({ ...examDate, year: e.target.value })}
                    className="flex-1 bg-white border border-[#D1D5DB] text-gray-800 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] appearance-none cursor-pointer text-sm"
                  >
                    <option value="" className="text-gray-400">Year</option>
                    {[2026, 2027, 2028, 2029].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-gray-800">
                How do you currently study? <span className="text-gray-400 font-normal">(optional)</span>
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
                  className={`group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4 ${(!userType || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-gray-500 text-xs text-center mt-3">
                  By creating an account, you agree to our{' '}
                  <Link to="/privacy" className="underline text-[#7C3AED] hover:text-[#6D28D9] transition-colors">Privacy Policy</Link>.
                </p>
              </div>
            )}
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
