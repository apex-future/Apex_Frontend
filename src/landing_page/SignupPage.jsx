import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WarningCircle, Eye, EyeClosed, ArrowRight, Sparkle } from '@phosphor-icons/react';
import { GoogleLogin } from '@react-oauth/google';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';
import Grainient from './components/Grainient';
import CardSwap, { Card } from './components/CardSwap';

import guide1 from '../assets/signup_guide/1.png';
import guide2 from '../assets/signup_guide/2.png';
import guide3 from '../assets/signup_guide/3.png';
import guide4 from '../assets/signup_guide/4.png';

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
          ? 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED] shadow-sm'
          : 'bg-white text-gray-700 border-[#D1D5DB] hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row font-sans text-gray-900 overflow-x-hidden">
      
      {/* LEFT COLUMN: Input Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between py-8 px-6 sm:px-12 lg:px-20 min-h-screen">
        {/* Top Logo Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoLight} alt="Apex Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <span className="font-bold text-xl tracking-tight text-[#1F2937]">Apex</span>
          </Link>
          <div className="text-xs font-semibold px-3 py-1 bg-purple-50 text-[#7C3AED] rounded-full border border-purple-100 flex items-center gap-1.5">
            <Sparkle size={13} weight="fill" />
            <span>Step {step} of 2</span>
          </div>
        </div>

        {/* Center Form Body */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-[32px] sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight">
              {step === 1 ? 'Create your account' : 'Personalize your info'}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {step === 1 ? 'Join thousands of students mastering their studies.' : 'Help us customize your learning journey.'}
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2.5 mb-5 shadow-sm">
              <WarningCircle size={20} weight="fill" className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form className="w-full space-y-4" onSubmit={handleNext}>
              <div>
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <input 
                  id="fullName"
                  type="text" 
                  placeholder="Full Name"
                  aria-label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-all"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="Email address"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-all"
                  required
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 characters)"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-base transition-all"
                  required
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeClosed size={19} weight="regular" /> : <Eye size={19} weight="regular" />}
                </button>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-black text-white py-3.5 rounded-full font-semibold text-[15px] transition-all shadow-md hover:shadow-lg active:scale-[0.99] mt-2 cursor-pointer"
              >
                Continue
              </button>

              <div className="w-full mt-4 text-center">
                <p className="text-[14px] text-gray-600">
                  Already have an account? <Link to="/login" className="text-[#7C3AED] font-semibold hover:underline">Log in</Link>
                </p>
              </div>

              <div className="flex items-center w-full my-5">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="px-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="w-full flex justify-center items-center">
                <div className="w-[80%] max-w-[320px] mx-auto flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google authentication failed.')}
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="280"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="w-full space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setStep(1)}
                className="text-gray-500 text-sm font-medium hover:text-gray-800 transition-colors cursor-pointer flex items-center gap-1 mb-2"
              >
                ← Back to details
              </button>

              <div className="space-y-2.5">
                <label id="userTypeLabel" className="text-sm font-semibold text-gray-800 block">
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
                  <label id="studyingForLabel" className="text-sm font-semibold text-gray-800 block">
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
                  <label className="text-sm font-semibold text-gray-800 block">
                    When is your exam? <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={examDate.month}
                      onChange={(e) => setExamDate({ ...examDate, month: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-full px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] appearance-none cursor-pointer text-sm font-medium"
                    >
                      <option value="" className="text-gray-400">Month</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={examDate.year}
                      onChange={(e) => setExamDate({ ...examDate, year: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-full px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] appearance-none cursor-pointer text-sm font-medium"
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
                <label className="text-sm font-semibold text-gray-800 block">
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
                className={`group w-full h-13 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full font-bold text-base transition-all duration-300 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2.5 active:scale-95 mt-4 cursor-pointer ${(!userType || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={19} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center pb-2">
          <p className="text-gray-500 text-xs">
            By creating an account, you agree to our{' '}
            <Link to="/privacy" className="underline text-[#7C3AED] hover:text-[#6D28D9] transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Grainient Background Box Container with CardSwap Showcase */}
      <div className="hidden lg:flex lg:w-1/2 p-4 lg:p-5 min-h-screen flex-col">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden flex flex-col justify-between p-10 text-white select-none shadow-xl min-h-[640px]">
          {/* WebGL Grainient Canvas Component */}
          <div className="absolute inset-0 z-0">
            <Grainient
              color1="#FF9FFC"
              color2="#5227FF"
              color3="#B497CF"
              timeSpeed={0.25}
              colorBalance={0.0}
              warpStrength={1.0}
              warpFrequency={5.0}
              warpSpeed={2.0}
              warpAmplitude={50.0}
              blendAngle={0.0}
              blendSoftness={0.05}
              rotationAmount={500.0}
              noiseScale={2.0}
              grainAmount={0.12}
              grainScale={2.0}
              grainAnimated={false}
              contrast={1.4}
              gamma={1.0}
              saturation={1.1}
              centerX={0.0}
              centerY={0.0}
              zoom={0.85}
            />
          </div>

          {/* Subtle Dark Overlay for contrast */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />

          {/* Top Header Text */}
          <div className="relative z-20">
            <h2
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-[40px] font-bold leading-[1.1] tracking-tight text-white"
            >
              The new era of studying,<br />
              <span className="text-white/70">unlocked with Apex.</span>
            </h2>
          </div>

          {/* CardSwap Showcase at bottom */}
          <div className="relative z-20 w-full flex justify-center items-end">
            <CardSwap
              width={560}
              height={315}
              cardDistance={55}
              verticalDistance={0}
              delay={3500}
              pauseOnHover={true}
              skewAmount={3}
            >
              <Card customClass="shadow-2xl rounded-2xl overflow-hidden border-none bg-transparent">
                <img src={guide1} alt="Signup Guide 1" className="w-full h-full object-cover rounded-2xl drop-shadow-xl" />
              </Card>
              <Card customClass="shadow-2xl rounded-2xl overflow-hidden border-none bg-transparent">
                <img src={guide2} alt="Signup Guide 2" className="w-full h-full object-cover rounded-2xl drop-shadow-xl" />
              </Card>
              <Card customClass="shadow-2xl rounded-2xl overflow-hidden border-none bg-transparent">
                <img src={guide3} alt="Signup Guide 3" className="w-full h-full object-cover rounded-2xl drop-shadow-xl" />
              </Card>
              <Card customClass="shadow-2xl rounded-2xl overflow-hidden border-none bg-transparent">
                <img src={guide4} alt="Signup Guide 4" className="w-full h-full object-cover rounded-2xl drop-shadow-xl" />
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SignupPage;
