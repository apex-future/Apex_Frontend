import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import logoLight from "../assets/logo/logo-light.jpg";
import authService from '../main_app/services/authService';

function OnboardingPage({ onComplete }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Onboarding fields
  const [userType, setUserType] = useState('');
  const [studyingFor, setStudyingFor] = useState([]);
  const [examDate, setExamDate] = useState({ month: '', year: '' });
  const [studyDevice, setStudyDevice] = useState('');

  const handlePersonalize = async () => {
    if (!userType) return;
    setLoading(true);

    const onboardingData = {
      user_type: userType,
      ...(studyingFor.length > 0 && { studying_for: studyingFor }),
      ...(examDate.month && examDate.year && {
        exam_date: `${examDate.month} ${examDate.year}`
      }),
      ...(studyDevice && { study_device: studyDevice }),
    };

    try {
      await authService.saveOnboarding(onboardingData);
    } catch (err) {
      console.error('Onboarding save failed:', err);
      // Non-blocking — proceed regardless
    } finally {
      setLoading(false);
      onComplete(); // Always proceed to app
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans" style={{ background: 'radial-gradient(circle at 50% 50%, #161a29 0%, #0f111a 100%)' }}>
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md lg:max-w-5xl flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoLight} alt="Apex Logo" className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] mb-6 shadow-2xl shadow-purple-500/20" />
          <p className="text-neutral-400 mt-2 text-sm lg:text-lg text-center">One last thing before you dive in.</p>
        </div>

        {/* Onboarding Form Card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-black/50 border border-white/20 relative z-10 transition-all duration-500">
          <div className="space-y-5">
            <p className="text-white/60 text-sm text-center mb-2">✦ Let's personalize Apex for you</p>
            
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

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
              onClick={handlePersonalize}
              disabled={!userType || loading}
              className={`group w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 mt-4 ${(!userType || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Personalize
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
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

export default OnboardingPage;
