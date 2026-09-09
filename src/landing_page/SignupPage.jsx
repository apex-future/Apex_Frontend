import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WarningCircle, Eye, EyeClosed, Star } from '@phosphor-icons/react';
import { GoogleLogin } from '@react-oauth/google';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';
import Grainient from './components/Grainient';
import Card from '../main_app/components/ui/Card';

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
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

    setLoading(true);
    setError('');

    try {
      const response = await authService.register(
        fullName.trim(),
        email.trim(),
        password
      );
      onLogin(response);
      navigate('/verify-email');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
      if (navigator.onLine && (!response?.user?.has_done_onboarding && localStorage.getItem('apex_has_done_onboarding') !== 'true')) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        </div>

        {/* Center Form Body */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-[32px] sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Join thousands of students mastering their studies.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2.5 mb-5 shadow-sm">
              <WarningCircle size={20} weight="fill" className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form className="w-full space-y-4" onSubmit={handleSignup}>
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
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-black disabled:bg-[#0F172A]/50 disabled:cursor-not-allowed text-white py-3.5 rounded-full font-semibold text-[15px] transition-all shadow-md hover:shadow-lg active:scale-[0.99] mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
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
        </div>

        {/* Footer Note */}
        <div className="text-center pb-2">
          <p className="text-gray-500 text-xs">
            By creating an account, you agree to our{' '}
            <Link to="/privacy" className="underline text-[#7C3AED] hover:text-[#6D28D9] transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Grainient Background Box Container with 3 Testimonial Comments */}
      <div className="hidden lg:flex lg:w-1/2 p-4 lg:p-5 min-h-screen flex-col">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden flex flex-col justify-between p-8 xl:p-10 text-white select-none shadow-xl min-h-[640px]">
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
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/15 via-black/5 to-black/35 pointer-events-none" />

          {/* Top Header Text */}
          <div className="relative z-20">
            <h2
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-[34px] xl:text-[38px] font-bold leading-[1.15] tracking-tight text-white"
            >
              The new era of studying,<br />
              <span className="text-white/75">unlocked with Apex.</span>
            </h2>
          </div>

          {/* Three Testimonial Comment Boxes: 2 Left, 1 Right (Middle) */}
          <div className="relative z-20 w-full flex flex-col gap-3.5 xl:gap-4 my-auto py-4">
            {/* Comment 1: Left Aligned */}
            <Card className="self-start w-full max-w-[370px] xl:max-w-[390px] !bg-white/10 hover:!bg-white/15 !backdrop-blur-xl !border !border-white/20 rounded-2xl p-4 xl:p-4.5 !shadow-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0">
                  CO
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[13.5px] text-white truncate">Chidinma O.</h4>
                    <div className="flex items-center gap-0.5 text-amber-300">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} weight="fill" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 truncate">300L Medicine · UI</p>
                </div>
              </div>
              <p className="text-[12.5px] xl:text-[13px] text-white/90 leading-relaxed font-normal">
                "The offline reader and instant flashcard recall are unmatched. Apex changed how I study completely."
              </p>
            </Card>

            {/* Comment 2: Right Aligned (Middle) */}
            <Card className="self-end w-full max-w-[370px] xl:max-w-[390px] !bg-white/10 hover:!bg-white/15 !backdrop-blur-xl !border !border-white/20 rounded-2xl p-4 xl:p-4.5 !shadow-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0">
                  DK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[13.5px] text-white truncate">David K.</h4>
                    <div className="flex items-center gap-0.5 text-amber-300">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} weight="fill" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 truncate">Law Scholar · UNILAG</p>
                </div>
              </div>
              <p className="text-[12.5px] xl:text-[13px] text-white/90 leading-relaxed font-normal">
                "The daily streak quests and distraction-free reader kept me locked in for 90+ days straight. Game changer."
              </p>
            </Card>

            {/* Comment 3: Left Aligned */}
            <Card className="self-start w-full max-w-[370px] xl:max-w-[390px] !bg-white/10 hover:!bg-white/15 !backdrop-blur-xl !border !border-white/20 rounded-2xl p-4 xl:p-4.5 !shadow-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0">
                  AB
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[13.5px] text-white truncate">Amina B.</h4>
                    <div className="flex items-center gap-0.5 text-amber-300">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} weight="fill" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 truncate">Software Engineering Student</p>
                </div>
              </div>
              <p className="text-[12.5px] xl:text-[13px] text-white/90 leading-relaxed font-normal">
                "Syncing seamlessly between my phone and laptop while reading offline on campus is a lifesaver."
              </p>
            </Card>
          </div>

          {/* Bottom Social Proof Bar */}
          <div className="relative z-20 flex items-center justify-between text-xs text-white/65 pt-2 border-t border-white/10">
            <span>Loved by thousands of students</span>
            <span className="flex items-center gap-1">
              <Star size={12} weight="fill" className="text-amber-300" /> 4.9/5 Rating
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SignupPage;
