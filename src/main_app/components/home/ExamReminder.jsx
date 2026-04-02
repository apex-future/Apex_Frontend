import React, { useState } from 'react';
import { Edit2, Bell, AlarmClock, Calendar, BookOpen, X, Trophy, Target, Type } from 'lucide-react';
import useStudyStore from '../../store/studyStore';
import useSpaceStore from '../../store/spaceStore';
import useQuizStore from '../../store/quizStore';
import { useNavigate } from 'react-router-dom';

const ExamReminder = () => {
    const { examDate, setExamDate, examName, setExamName } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const navigate = useNavigate();
    
    // States
    const [isEditing, setIsEditing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    
    // Form temps
    const [tempDate, setTempDate] = useState(examDate || '');
    const [tempName, setTempName] = useState(examName || '');
    
    const customSpaces = spaces.filter(s => !s.isSystem);
    const linkedSpace = customSpaces.find(s => s.examDate === examDate) || customSpaces.find(s => s.isLinkedToExam); // Fallback logic based on previous states
    
    const { getAggregatedStatsForSpace } = useQuizStore();
    const linkedSpaceStats = linkedSpace ? getAggregatedStatsForSpace(linkedSpace.id) : null;

    const calculateDaysLeft = () => {
        if (!examDate) return null;
        const diff = new Date(examDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysLeft = calculateDaysLeft();

    const [selectedSpaceId, setSelectedSpaceId] = useState(linkedSpace?.id || '');

    const handleSave = () => {
        setExamDate(tempDate);
        setExamName(tempName);
        // Link to space by setting its examDate or flag
        customSpaces.forEach(s => {
          if (s.id === selectedSpaceId) {
             updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
          } else if (s.isLinkedToExam) {
             updateSpace(s.id, { isLinkedToExam: false, examDate: null });
          }
        });
        setIsEditing(false);
    };

    const CardContainer = ({ children, onClick, className = '' }) => (
        <div className="w-full">
            <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>{examName || 'Exam Timer'}</h2>
            <div 
                onClick={onClick}
                className={`bg-card-glass backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-border-default hover:border-accent-primary/40 hover:shadow-md transition-all duration-500 group overflow-hidden shadow-md relative h-48 xs:h-60 sm:h-64 flex items-center cursor-pointer ${className}`}
            >
                {children}
            </div>
        </div>
    );

    // ==========================================
    // VIEW 1: No Exam Set
    // ==========================================
    if (!examDate) {
        return (
            <CardContainer onClick={() => setIsEditing(true)} className="border-dashed">
                <div className="absolute bottom-2 -left-2 size-44 text-accent-primary/10 rotate-12 group-hover:text-accent-primary/20 transition-all duration-1000 pointer-events-none">
                    <AlarmClock size="100%" strokeWidth={1} />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between w-full relative z-10 text-center sm:text-left gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight mb-1">Track Your Progress</h3>
                        <p className="text-sm text-text-tertiary font-medium">Set your exam date to start coaching.</p>
                    </div>
                    <div className="px-6 py-2 bg-accent-primary rounded-xl text-sm font-bold text-white hover:bg-accent-hover transition-all">
                        Set Date
                    </div>
                </div>
            </CardContainer>
        );
    }

    // ==========================================
    // VIEW 2: Dashboard Widget (Motivational)
    // ==========================================
    // Generate motivational message
    let motivationalMessage = `Keep your momentum going! You have ${daysLeft} days left to prepare.`;
    if (linkedSpace && linkedSpace.activitySummaries?.timeSpent > 0 && linkedSpaceStats) {
        motivationalMessage = `You've invested ${linkedSpace.activitySummaries.timeSpent} mins and scored an avg of ${linkedSpaceStats.averageScore}% on practice quizzes! Keep pushing, coach!`;
    } else if (linkedSpace && linkedSpace.activitySummaries?.timeSpent > 0) {
        motivationalMessage = `You've invested ${linkedSpace.activitySummaries.timeSpent} mins preparing for ${examName || linkedSpace.name}. Keep pushing, coach!`;
    } else if (linkedSpace) {
        motivationalMessage = `Your study space for ${examName || linkedSpace.name} is ready. Time to dive into those books!`;
    }

    const unexpandedWidget = (
        <CardContainer onClick={() => setShowDetails(true)} className="group cursor-pointer border-accent-primary/10 hover:border-accent-primary/30 active:scale-[0.98]">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-accent-primary/10 transition-all" />
            
            <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex-1 pr-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Trophy size={18} className="text-accent-primary" />
                        <span className="text-sm font-bold tracking-widest uppercase text-accent-primary">Coach Check-in</span>
                     </div>
                     <h3 className="text-lg md:text-xl font-bold text-text-primary tracking-tight leading-tight mb-2">
                        {motivationalMessage}
                     </h3>
                </div>

                <div className="flex flex-col items-center justify-center pl-4 border-l border-border-default">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-black text-text-primary tabular-nums tracking-tighter">
                            {daysLeft > 0 ? daysLeft : 0}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Days Left</span>
                    
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        daysLeft <= 7 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                    }`}>
                        {daysLeft <= 0 ? 'Exam Day' : daysLeft <= 7 ? 'Urgent' : 'On Track'}
                    </div>
                </div>
            </div>
        </CardContainer>
    );

    // ==========================================
    // MODAL RENDERS (Detail View & Edit View)
    // ==========================================
    return (
        <>
            {!isEditing ? unexpandedWidget : (
               <div className="w-full">
                  <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Exam Details</h2>
                  <div className="bg-card-glass backdrop-blur-xl border border-border-default p-6 rounded-3xl flex flex-col gap-4">
                      <div>
                          <label className="text-xs font-bold text-text-tertiary uppercase block mb-1">Exam Name</label>
                          <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 items-center gap-3">
                              <Type size={18} className="text-accent-primary" />
                              <input type="text" value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="e.g. JAMB 2026" className="w-full bg-transparent outline-none text-sm font-medium" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-text-tertiary uppercase block mb-1">Date</label>
                          <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 items-center gap-3">
                              <Calendar size={18} className="text-accent-primary" />
                              <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)} className="w-full bg-transparent outline-none text-sm font-medium" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-text-tertiary uppercase block mb-1">Link Space</label>
                          <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 items-center gap-3">
                              <BookOpen size={18} className="text-accent-primary" />
                              <select value={selectedSpaceId} onChange={e=>setSelectedSpaceId(e.target.value)} className="w-full bg-transparent outline-none text-sm font-medium appearance-none">
                                  <option value="">Do not link</option>
                                  {customSpaces.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                          <button onClick={() => { setIsEditing(false); setShowDetails(false); }} className="px-5 py-2 font-semibold text-text-secondary bg-neutral-100 dark:bg-zinc-800 rounded-xl">Cancel</button>
                          <button onClick={handleSave} disabled={!tempDate} className="px-5 py-2 font-bold text-white bg-accent-primary rounded-xl disabled:opacity-50">Save Exam</button>
                      </div>
                  </div>
               </div>
            )}

            {/* DETAIL MODAL OVERLAY */}
            {showDetails && !isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                         <div className="p-6 border-b border-border-default flex justify-between items-center bg-accent-primary/5">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-primary/10 rounded-xl text-accent-primary">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight">{examName || 'Upcoming Exam'}</h3>
                                    <p className="text-sm font-semibold text-text-tertiary">{new Date(examDate).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <button onClick={() => setShowDetails(false)} className="p-2 text-text-secondary hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20}/></button>
                         </div>

                         <div className="p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-zinc-800/50 rounded-2xl border border-border-default">
                               <div className="flex flex-col">
                                   <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Countdown</span>
                                   <span className="text-3xl font-black text-text-primary">{daysLeft > 0 ? daysLeft : 0} <span className="text-base text-text-tertiary font-bold">days</span></span>
                               </div>
                               <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${daysLeft <= 7 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                   {daysLeft <= 0 ? 'Exam Day' : daysLeft <= 7 ? 'Urgent' : 'On Track'}
                               </div>
                            </div>

                            {linkedSpace ? (
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary mb-3">Linked Study Space</h4>
                                    <div className="border border-border-default rounded-2xl p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-text-primary">{linkedSpace.name}</span>
                                            <button onClick={() => navigate(`/space/${linkedSpace.id}`)} className="text-xs font-bold text-white bg-accent-primary px-3 py-1.5 rounded-lg hover:bg-accent-hover">Enter Space</button>
                                        </div>
                                        <div className="flex gap-4 border-t border-border-default pt-3 mt-1">
                                            <div>
                                                <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Books</span>
                                                <span className="font-bold text-text-primary">{linkedSpace.books?.length || 0}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Time Studied</span>
                                                <span className="font-bold text-text-primary">{linkedSpace.activitySummaries?.timeSpent || 0}m</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Avg Score</span>
                                                <span className="font-bold text-text-primary">{linkedSpaceStats?.averageScore ? `${linkedSpaceStats.averageScore}%` : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border border-border-default border-dashed rounded-2xl text-center">
                                    <p className="text-sm text-text-tertiary italic mb-2">No study space linked to this exam.</p>
                                    <button onClick={() => { setShowDetails(false); setIsEditing(true); }} className="text-xs font-bold text-accent-primary hover:underline">Link a Space now</button>
                                </div>
                            )}
                         </div>

                         <div className="p-4 bg-neutral-50 dark:bg-zinc-800/80 border-t border-border-default flex justify-end">
                             <button onClick={() => { setShowDetails(false); setIsEditing(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-text-secondary hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                                 <Edit2 size={16} /> Edit Configuration
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExamReminder;

