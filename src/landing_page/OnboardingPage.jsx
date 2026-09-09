import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  SpeakerHigh, 
  SpeakerSlash, 
  ArrowCounterClockwise,
  Check, 
  Sparkle,
  GraduationCap,
  BookOpen,
  Books,
  Compass,
  Clock,
  CalendarBlank,
  Target,
  WarningCircle
} from '@phosphor-icons/react';
import Orb from '../main_app/components/ui/Orb';
import Card from '../main_app/components/ui/Card';
import Button from '../main_app/components/ui/Button';
import authService from '../main_app/services/authService';
import useAuthStore from '../main_app/store/authStore';
import useSound from '../main_app/hooks/useSound';
import logoLight from "../assets/logo/logo-light.jpg";
import Particles from '../main_app/components/ui/Particles';

const CLEO_START_VOICE = '/cleo_voice/start_screen.mp3';
const CLEO_FINAL_VOICE = '/cleo_voice/final_screen.mp3';

function OnboardingPage({ onComplete }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // Screen step: 1 through 8
  const [screen, setScreen] = useState(1);

  // Form states
  const [userType, setUserType] = useState(''); // 'student' | 'casual_reader' | 'both'
  const [examType, setExamType] = useState(''); // 'University Exam' | 'JAMB' | 'SSCE (Waec, Neco etc)' | 'Others' | 'None'
  const [customExamName, setCustomExamName] = useState('');
  const [examDate, setExamDate] = useState({ month: '', year: '' });
  const [studyStage, setStudyStage] = useState(''); // 'Just starting serious prep' | 'Been studying for a while' | 'In final revision mode'
  const [dailyHours, setDailyHours] = useState('30 mins'); // '30 mins' | '1 hr' | '2 hrs' | '3+ hrs'
  const [reminderTime, setReminderTime] = useState('18:00');
  const [northStar, setNorthStar] = useState('');
  const [referralSource, setReferralSource] = useState('');

  // Audio using useSound hook
  const [isMuted, setIsMuted] = useState(false);
  const [playStartVoice, { stop: stopStartVoice, pause: pauseStartVoice, isPlaying: isStartPlaying }] = useSound(CLEO_START_VOICE);
  const [playFinalVoice, { stop: stopFinalVoice, pause: pauseFinalVoice, isPlaying: isFinalPlaying }] = useSound(CLEO_FINAL_VOICE);

  const isVoicePlaying = screen === 1 ? isStartPlaying : screen === 8 ? isFinalPlaying : false;
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Track if initial voice line has played once in this session
  const hasPlayedScreen1Ref = useRef(false);
  const hasPlayedScreen8Ref = useRef(false);

  // Stable references so audio doesn't self-cancel when isPlaying updates
  const playStartRef = useRef(playStartVoice);
  playStartRef.current = playStartVoice;
  const stopStartRef = useRef(stopStartVoice);
  stopStartRef.current = stopStartVoice;
  const pauseStartRef = useRef(pauseStartVoice);
  pauseStartRef.current = pauseStartVoice;

  const playFinalRef = useRef(playFinalVoice);
  playFinalRef.current = playFinalVoice;
  const stopFinalRef = useRef(stopFinalVoice);
  stopFinalRef.current = stopFinalVoice;
  const pauseFinalRef = useRef(pauseFinalVoice);
  pauseFinalRef.current = pauseFinalVoice;

  // Save loading & error
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if user enters without data (offline) or is already onboarded
  useEffect(() => {
    const hasDone = currentUser?.has_done_onboarding || 
                    localStorage.getItem('apex_has_done_onboarding') === 'true';
    if (!navigator.onLine || hasDone) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Listen to offline event: if connection drops while on onboarding screen, allow offline reading
  useEffect(() => {
    const handleOffline = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [navigate]);

  // Auto-play Cleo voice for Screen 1 and Screen 8 (respecting mute state & session history)
  useEffect(() => {
    if (isMuted) return;

    const attemptPlay = () => {
      if (isMuted) return;
      if (screen === 1) {
        if (hasPlayedScreen1Ref.current) return;
        const playFunc = playStartRef.current;
        if (playFunc) {
          const p = playFunc();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              hasPlayedScreen1Ref.current = true;
              setIsAutoplayBlocked(false);
            }).catch((err) => {
              console.log('[Onboarding] Autoplay blocked by browser policy:', err?.message);
              if (err?.name === 'NotAllowedError' || err?.message?.includes('interact')) {
                setIsAutoplayBlocked(true);
              }
            });
          }
        }
      } else if (screen === 8) {
        if (hasPlayedScreen8Ref.current) return;
        const playFunc = playFinalRef.current;
        if (playFunc) {
          const p = playFunc();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              hasPlayedScreen8Ref.current = true;
            }).catch((err) => {
              console.log('[Onboarding] Autoplay blocked on Screen 8:', err?.message);
            });
          }
        }
      }
    };

    if (screen === 1 && !hasPlayedScreen1Ref.current) {
      // 1. Attempt autoplay on first land
      attemptPlay();

      // 2. Gesture fallback: the very first tap anywhere in the window unlocks and plays it
      const handleGesture = () => {
        if (!hasPlayedScreen1Ref.current) {
          attemptPlay();
        }
      };

      window.addEventListener('pointerdown', handleGesture, { once: true, capture: true });
      window.addEventListener('keydown', handleGesture, { once: true, capture: true });
      window.addEventListener('click', handleGesture, { once: true, capture: true });

      return () => {
        window.removeEventListener('pointerdown', handleGesture, { capture: true });
        window.removeEventListener('keydown', handleGesture, { capture: true });
        window.removeEventListener('click', handleGesture, { capture: true });
        stopStartRef.current();
      };
    } else if (screen === 8 && !hasPlayedScreen8Ref.current) {
      attemptPlay();
      return () => {
        stopFinalRef.current();
      };
    } else {
      // Moving away or returning after already played: ensure clean audio stop
      if (screen === 1) {
        return () => {
          stopStartRef.current();
        };
      } else {
        stopStartRef.current();
        setIsAutoplayBlocked(false);
      }
    }
  }, [screen, isMuted]);

  const toggleSound = () => {
    if (!isMuted) {
      setIsMuted(true);
      if (screen === 1) pauseStartRef.current();
      if (screen === 8) pauseFinalRef.current();
    } else {
      setIsMuted(false);
      if (screen === 1) playStartRef.current();
      if (screen === 8) playFinalRef.current();
    }
  };

  const replayVoice = () => {
    setIsMuted(false);
    if (screen === 1) {
      stopStartRef.current();
      playStartRef.current();
    } else if (screen === 8) {
      stopFinalRef.current();
      playFinalRef.current();
    }
  };

  // Navigation handlers
  const handleScreen2Next = () => {
    if (!userType) return;
    if (userType === 'casual_reader') {
      setScreen(5); // Casual Reader skips Exam context & Prep stage
    } else {
      setScreen(3);
    }
  };

  const handleScreen3Next = () => {
    if (!examType) return;
    if (examType === 'None') {
      setScreen(5); // Skip Screen 4 (prep stage) if not preparing for an exam
    } else {
      setScreen(4);
    }
  };

  const handleScreen5Back = () => {
    if (userType === 'casual_reader') {
      setScreen(2);
    } else if (examType === 'None') {
      setScreen(3);
    } else {
      setScreen(4);
    }
  };

  // Final submit
  const handleFinalSubmit = async () => {
    setSaving(true);
    setErrorMsg('');

    // Formulate final payload
    const formattedExamDate = (examDate.month && examDate.year) 
      ? `${examDate.month} ${examDate.year}` 
      : null;

    const resolvedExamType = examType === 'Others' 
      ? (customExamName.trim() || 'Others') 
      : (examType === 'None' ? null : examType);

    const payload = {
      user_type: userType || 'student',
      studying_for: resolvedExamType ? [resolvedExamType] : [],
      exam_date: examType === 'None' ? null : formattedExamDate,
      study_stage: examType === 'None' ? null : (studyStage || null),
      daily_goal_hours: dailyHours,
      study_reminder_time: reminderTime,
      north_star: northStar ? `I AM ${northStar.replace(/^I AM\s*/i, '').trim()}` : null,
      referral_source: referralSource || null,
      has_done_onboarding: true,
    };

    // Save to localStorage immediately so app is always offline-safe
    localStorage.setItem('apex_has_done_onboarding', 'true');

    try {
      await authService.saveOnboarding(payload);
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          ...payload,
          has_done_onboarding: true,
        });
      }
    } catch (err) {
      console.error('[Onboarding] Cloud save error, offline-first cached locally:', err);
    } finally {
      setSaving(false);
      if (onComplete) {
        onComplete();
      } else {
        navigate('/import', { replace: true });
      }
    }
  };

  const showDatePicker = Boolean(examType) && examType !== 'None';

  return (
    <div className="min-h-screen w-full bg-[#0f1017] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Ambient background glow matching Apex dashboard */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
      </div>

      {/* Interactive Particles Background for Screen 6 (Your North Star) */}
      {screen === 6 && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none animate-in fade-in duration-700">
          <Particles 
            particleColors={['#ffffff', '#fdf4ff', '#c084fc', '#a855f7', '#818cf8', '#e879f9']}
            particleCount={250}
            particleSpread={13}
            speed={0.12}
            particleBaseSize={140}
            sizeRandomness={1.2}
            moveParticlesOnHover={true}
            particleHoverFactor={1.2}
            alphaParticles={true}
            disableRotation={false}
            cameraDistance={22}
            shape="star"
          />
        </div>
      )}

      {/* Top Header Bar */}
      <header className="relative z-30 w-full px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img 
            src={logoLight} 
            alt="Apex Logo" 
            className="w-7 h-7 rounded-xl object-cover shadow-sm border border-white/10" 
          />
          <span className="font-bold text-base tracking-tight text-white/90">Apex</span>
        </div>

        {/* Step indicator (Screens 2 - 7) */}
        {screen > 1 && screen < 8 && (
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <span className="text-[11px] font-semibold text-purple-300">Step {screen} of 8</span>
          </div>
        )}

        {/* Audio control button for Screen 1 and Screen 8 */}
        {(screen === 1 || screen === 8) && (
          <div className="flex items-center gap-2">
            {isVoicePlaying && (
              <div className="flex items-center gap-0.5 px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full animate-pulse">
                <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] font-medium text-purple-200 ml-1.5">Cleo Speaking</span>
              </div>
            )}
            <button
              onClick={toggleSound}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 transition-colors cursor-pointer"
              title={!isMuted ? "Mute voice" : "Play voice"}
            >
              {!isMuted ? <SpeakerHigh size={15} weight="fill" className="text-purple-300" /> : <SpeakerSlash size={15} weight="regular" className="text-white/40" />}
            </button>
            <button
              onClick={replayVoice}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 transition-colors cursor-pointer"
              title="Replay Cleo voice"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4 w-full max-w-xl mx-auto">
        
        {/* ======================================================== */}
        {/* SCREEN 1: Welcome from Cleo (Full Screen Orb)            */}
        {/* ======================================================== */}
        {screen === 1 && (
          <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
            {/* Glowing Cleo Orb Component */}
            <div 
              onClick={() => {
                if (!isVoicePlaying) {
                  setIsMuted(false);
                  setIsAutoplayBlocked(false);
                  playStartRef.current();
                }
              }}
              className="relative w-60 h-60 sm:w-72 sm:h-72 my-2 flex items-center justify-center cursor-pointer group"
              title="Click Cleo to speak"
            >
              <div className="absolute inset-0 rounded-full bg-purple-600/25 blur-3xl scale-90 pointer-events-none animate-pulse" />
              <div className="w-full h-full relative z-10">
                <Orb
                  hue={280}
                  hoverIntensity={0.3}
                  rotateOnHover={true}
                  forceHoverState={isVoicePlaying}
                  backgroundColor="#0f1017"
                />
              </div>
              {isAutoplayBlocked && !isVoicePlaying && (
                <div className="absolute z-20 bottom-3 px-3 py-1 rounded-full bg-purple-950/90 backdrop-blur-md border border-purple-400/40 text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950/60 animate-bounce">
                  <SpeakerHigh size={12} weight="fill" className="text-purple-300" />
                  <span>Tap Cleo to listen</span>
                </div>
              )}
            </div>

            <div className="space-y-3 max-w-md mt-4">
              <div className="inline-flex items-center gap-2 justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                  <Sparkle size={13} weight="fill" />
                  <span>Meet Cleo</span>
                </div>
                {isAutoplayBlocked && !isVoicePlaying && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(false);
                      setIsAutoplayBlocked(false);
                      playStartRef.current();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 animate-pulse transition-all cursor-pointer"
                  >
                    <SpeakerHigh size={13} weight="fill" />
                    <span>Tap to hear Cleo</span>
                  </button>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Hey Scholar, I'm Cleo.
              </h1>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                I'm your study companion inside Apex. Let's set this up for your journey.
              </p>
            </div>

            <div className="w-full max-w-xs mt-8">
              <Button
                variant="primary"
                fullWidth={true}
                onClick={() => setScreen(2)}
                className="py-3.5 rounded-full text-sm font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <span>Let's Begin</span>
                <ArrowRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: Who Are You?                                   */}
        {/* ======================================================== */}
        {screen === 2 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Who are you?
              </h2>
              <p className="text-sm text-white/60 max-w-sm mx-auto">
                Choose what best describes your primary focus in Apex.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { 
                  id: 'student', 
                  title: 'Student', 
                  desc: 'Preparing for exams (JAMB, WAEC, University, Certs)',
                  icon: GraduationCap 
                },
                { 
                  id: 'casual_reader', 
                  title: 'Casual Reader', 
                  desc: 'Reading for curiosity, personal growth, and self-study',
                  icon: BookOpen 
                },
                { 
                  id: 'both', 
                  title: 'Both', 
                  desc: 'Balancing academic syllabus alongside personal reading',
                  icon: Books 
                },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = userType === option.id;
                return (
                  <Card
                    key={option.id}
                    onClick={() => setUserType(option.id)}
                    className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? '!border-purple-500 !bg-purple-600/15 !shadow-lg !shadow-purple-500/20'
                        : '!border-white/10 !bg-white/5 hover:!bg-white/10 hover:!border-white/20'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70'
                    }`}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-white">{option.title}</h3>
                        {isSelected && <Check size={18} weight="bold" className="text-purple-400 shrink-0" />}
                      </div>
                      <p className="text-xs sm:text-sm text-white/60 mt-0.5 leading-normal">
                        {option.desc}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setScreen(1)}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                disabled={!userType}
                onClick={handleScreen2Next}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: Exam Context (Student / Both only)             */}
        {/* ======================================================== */}
        {screen === 3 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                What are you preparing for?
              </h2>
              <p className="text-sm text-white/60">
                Pick your target examination milestone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {['University Exam', 'JAMB', 'SSCE (Waec, Neco etc)', 'Others', 'None'].map((item) => {
                const isSelected = examType === item;
                const isNone = item === 'None';
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setExamType(item)}
                    className={`py-3 px-3.5 sm:px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between text-left ${
                      isNone ? 'col-span-2' : ''
                    } ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/15'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="leading-snug">{item}</span>
                    {isSelected && <Check size={16} weight="bold" className="text-purple-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Custom exam name input when "Others" is selected */}
            {examType === 'Others' && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                  <GraduationCap size={16} weight="fill" />
                  <span>Specify your examination</span>
                </div>
                <input
                  type="text"
                  value={customExamName}
                  onChange={(e) => setCustomExamName(e.target.value)}
                  placeholder="e.g., SAT, GRE, MCAT, ICAN, Bar Exam..."
                  className="w-full bg-[#161722] border border-white/15 text-white placeholder:text-white/35 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
              </div>
            )}

            {/* Conditional Date Picker shown for any selected exam */}
            {showDatePicker && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                  <CalendarBlank size={16} weight="fill" />
                  <span>When is your exam?</span>
                </div>
                <div className="flex gap-2.5">
                  <select
                    value={examDate.month}
                    onChange={(e) => setExamDate({ ...examDate, month: e.target.value })}
                    className="flex-1 bg-[#161722] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" className="bg-[#161722] text-white/40">Select Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <option key={m} value={m} className="bg-[#161722] text-white">{m}</option>
                    ))}
                  </select>
                  <select
                    value={examDate.year}
                    onChange={(e) => setExamDate({ ...examDate, year: e.target.value })}
                    className="flex-1 bg-[#161722] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" className="bg-[#161722] text-white/40">Select Year</option>
                    {['2026', '2027', '2028'].map((y) => (
                      <option key={y} value={y} className="bg-[#161722] text-white">{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setScreen(2)}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                disabled={!examType || (examType === 'Others' && !customExamName.trim())}
                onClick={handleScreen3Next}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: Your Current Stage (Student / Both only)       */}
        {/* ======================================================== */}
        {screen === 4 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Where are you in your prep?
              </h2>
              <p className="text-sm text-white/60">
                This helps Cleo calibrate your pace and targets.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { 
                  id: 'Just starting serious prep', 
                  title: 'Just starting serious prep', 
                  desc: 'Setting up my schedule and covering syllabus basics.' 
                },
                { 
                  id: 'Been studying for a while', 
                  title: 'Been studying for a while', 
                  desc: 'Midway through core topics, reinforcing with practice.' 
                },
                { 
                  id: 'In final revision mode', 
                  title: 'In final revision mode', 
                  desc: 'Sharpening speed, past questions, and weak spots.' 
                },
              ].map((stage) => {
                const isSelected = studyStage === stage.id;
                return (
                  <Card
                    key={stage.id}
                    onClick={() => setStudyStage(stage.id)}
                    className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? '!border-purple-500 !bg-purple-600/15 !shadow-lg !shadow-purple-500/20'
                        : '!border-white/10 !bg-white/5 hover:!bg-white/10 hover:!border-white/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-white">{stage.title}</h3>
                        {isSelected && <Check size={18} weight="bold" className="text-purple-400 shrink-0" />}
                      </div>
                      <p className="text-xs sm:text-sm text-white/60 mt-1 leading-normal">
                        {stage.desc}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setScreen(3)}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                disabled={!studyStage}
                onClick={() => setScreen(5)}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: Daily Intention + Study Reminder               */}
        {/* ======================================================== */}
        {screen === 5 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Daily Intention & Reminders
              </h2>
              <p className="text-sm text-white/60">
                Commitment starts small. What feels achievable every single day?
              </p>
            </div>

            <div className="space-y-5 pt-2">
              {/* Question 1: Focused Time */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
                  <Target size={16} className="text-purple-400" />
                  <span>How much focused time per day feels realistic?</span>
                </label>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {['30 mins', '1 hr', '2 hrs', '3+ hrs'].map((h) => {
                    const isSelected = dailyHours === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setDailyHours(h)}
                        className={`py-3 px-1.5 sm:px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-500/20'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Time Picker */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
                  <Clock size={16} className="text-purple-400" />
                  <span>What time should I remind you to study?</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={handleScreen5Back}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                onClick={() => setScreen(6)}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 6: Your North Star                                */}
        {/* ======================================================== */}
        {screen === 6 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                One line. Why do you study?
              </h2>
              <p className="text-xs sm:text-sm text-purple-300/80 max-w-sm mx-auto">
                Not what you want to achieve — who you're becoming. Identity is what makes the habit stick.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="relative flex items-center bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5 focus-within:border-purple-500 transition-colors">
                <span className="font-bold text-sm tracking-wider text-purple-400 mr-2 shrink-0">I AM</span>
                <input
                  type="text"
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value)}
                  placeholder="...someone who studies every day, even when I don't feel like it"
                  className="w-full bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
                />
              </div>

              {/* Quick chips */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Tap to try one:</p>
                <div className="flex flex-col gap-2">
                  {[
                    "...someone who doesn't make excuses",
                    "...the student who earns their result quietly",
                    "...someone who shows up before anyone else does"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setNorthStar(chip)}
                      className="text-left text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setScreen(5)}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                onClick={() => setScreen(7)}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 7: Where Did You Hear About Us?                   */}
        {/* ======================================================== */}
        {screen === 7 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                One last thing — how did you find Apex?
              </h2>
              <p className="text-sm text-white/60">
                Tap an option to continue.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {[
                'Instagram or TikTok',
                'Twitter / X',
                'A friend or classmate',
                'WhatsApp group',
                'YouTube',
                'Google / Search',
                'My school or a teacher',
                'Other'
              ].map((src) => {
                const isSelected = referralSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      setReferralSource(src);
                    }}
                    className={`py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{src}</span>
                    {isSelected && <Check size={15} weight="bold" className="text-purple-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setScreen(6)}
                className="px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={15} weight="bold" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                fullWidth={true}
                disabled={!referralSource}
                onClick={() => setScreen(8)}
                className="py-3 rounded-full text-sm font-bold shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 8: Summary & Final Cleo Call-to-Action            */}
        {/* ======================================================== */}
        {screen === 8 && (
          <div className="w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
            {/* Visual reflection card */}
            <div className="relative p-6 sm:p-7 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/15 text-left space-y-4 shadow-2xl shadow-purple-900/20">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-3">
                <Compass size={16} weight="fill" />
                <span>Your Apex Journey Blueprint</span>
              </div>

              <div className="space-y-2.5 text-sm sm:text-base text-white/90 leading-relaxed font-normal">
                <p>
                  You're a <span className="font-bold text-purple-300 capitalize">{userType === 'casual_reader' ? 'Casual Reader' : userType}</span>.
                </p>

                {userType !== 'casual_reader' && examType && (
                  <p>
                    Preparing for <span className="font-bold text-purple-300">{examType}</span>
                    {examDate.month && examDate.year ? ` on ` : ''}
                    {examDate.month && examDate.year && (
                      <span className="font-bold text-purple-300">{examDate.month} {examDate.year}</span>
                    )}.
                  </p>
                )}

                <p>
                  Comfortable reading <span className="font-bold text-purple-300">{dailyHours}</span> every day.
                </p>

                {northStar && (
                  <p>
                    And you said you're <span className="font-bold text-purple-300">"{northStar.trim()}"</span>.
                  </p>
                )}

                <p className="text-white/60 text-xs sm:text-sm pt-1 italic">
                  That's who we're building with. Let's go, Scholar.
                </p>
              </div>
            </div>

            {/* Cleo Voice Quote */}
            <div className="p-4 rounded-2xl bg-purple-600/15 border border-purple-500/25 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 text-xs font-semibold">
                <Sparkle size={13} weight="fill" />
                <span>Cleo</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                "All set, Scholar. I've seen what you're here for. Let's build something you'll actually be proud of."
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs">
                <WarningCircle size={16} weight="fill" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* CTA: Upload My First Textbook */}
            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth={true}
                disabled={saving}
                onClick={handleFinalSubmit}
                className="py-4 rounded-full text-base font-bold shadow-xl shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Upload My First Textbook</span>
                    <ArrowRight size={18} weight="bold" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* Footer bar */}
      <footer className="relative z-20 w-full px-6 py-4 text-center text-xs text-white/40">
        Apex — Offline-first intelligent reading companion
      </footer>

    </div>
  );
}

export default OnboardingPage;
