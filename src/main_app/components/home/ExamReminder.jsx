import React, { useState, useEffect } from 'react';
import { Edit2, Bell, AlarmClock, Calendar, BookOpen, X, Trophy, Target, Type, Trash2, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import useStudyStore from '../../store/studyStore';
import useSpaceStore from '../../store/spaceStore';
import { useNavigate } from 'react-router-dom';
import { showToastGlobal } from '../../hooks/useToast';

const ExamReminder = () => {
    const { exams, examDate, setExamDate, examName, setExamName, addExam, updateExam, deleteExam, togglePauseExam } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const navigate = useNavigate();
    
    // Combine multi exams array with legacy fallback
    const examsList = exams?.length > 0 ? exams : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []);
    
    // States
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeExam = examsList[currentIndex] || null;
    const [isEditing, setIsEditing] = useState(false);
    
    // Form temps
    const [tempDate, setTempDate] = useState('');
    const [tempName, setTempName] = useState('');
    
    useEffect(() => {
        if (activeExam) {
            setTempDate(activeExam.date || '');
            setTempName(activeExam.name || '');
        }
    }, [activeExam]);
    
    const customSpaces = spaces.filter(s => !s.isSystem);
    const linkedSpace = customSpaces.find(s => s.examDate === activeExam?.date) || customSpaces.find(s => s.isLinkedToExam);

    const calculateDaysLeft = () => {
        if (!activeExam?.date) return null;
        const diff = new Date(activeExam.date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft();

    const [selectedSpaceId, setSelectedSpaceId] = useState(linkedSpace?.id || '');

    const nextExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s + 1) % examsList.length); };
    const prevExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s - 1 + examsList.length) % examsList.length); };

    const handleSave = () => {
        const isNew = !activeExam || activeExam.id === 'legacy';
        
        if (activeExam?.id === 'legacy') {
            setExamDate(tempDate);
            setExamName(tempName);
        } else if (activeExam?.id) {
            updateExam(activeExam.id, { name: tempName, date: tempDate });
        } else {
            addExam({ name: tempName, date: tempDate });
        }
        
        customSpaces.forEach(s => {
          if (s.id === selectedSpaceId) {
             updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
          } else if (s.isLinkedToExam) {
             updateSpace(s.id, { isLinkedToExam: false, examDate: null });
          }
        });
        setIsEditing(false);
        
        if (isNew) {
             const spName = selectedSpaceId ? customSpaces.find(s => s.id === selectedSpaceId)?.name : '';
             const finalName = tempName || spName || 'your exam';
             showToastGlobal(`Your study space for ${finalName} is ready. Time to dive into those books!`, 'success');
        }
    };

    const CardContainer = ({ children, onClick, className = '' }) => (
        <div className="w-full relative">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className='text-lg sm:text-xl font-semibold text-text-primary tracking-tight'>{activeExam?.name || 'Exam Timer'}</h2>
                {examsList.length > 1 && <span className="text-xs font-bold text-text-tertiary">{currentIndex + 1} of {examsList.length}</span>}
            </div>
            <div 
                onClick={onClick}
                className={`bg-card-glass backdrop-blur-xl rounded-3xl p-4 md:p-8 border-2 border-border-default hover:border-accent-primary/40 hover:shadow-md transition-all duration-500 group overflow-hidden shadow-md relative h-48 xs:h-60 sm:h-64 flex items-center cursor-pointer ${className} ${(activeExam?.isPaused && !isEditing) ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
                {children}
            </div>
        </div>
    );

    // ==========================================
    // VIEW 1: No Exam Set
    // ==========================================
    if (!activeExam && !isEditing) {
        return (
            <CardContainer onClick={() => setIsEditing(true)} className="border-dashed">
                <div className="absolute bottom-2 -left-2 size-44 text-accent-primary/10 rotate-12 group-hover:rotate-0 group-hover:text-accent-primary/20 transition-all duration-1000 pointer-events-none">
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
    // VIEW 2: Dashboard Widget (with Carousel & Actions)
    // ==========================================

    const unexpandedWidget = (
        <CardContainer onClick={() => navigate('/exams')} className="group cursor-pointer border-accent-primary/10 hover:border-accent-primary/30 active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-accent-primary/10 transition-all pointer-events-none" />
            
            {/* Carousel Navigation Chevrons */}
            {examsList.length > 1 && (
                <>
                   <button onClick={prevExam} className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-colors"><ChevronLeft size={24}/></button>
                   <button onClick={nextExam} className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-colors"><ChevronRight size={24}/></button>
                </>
            )}

            <div className="flex flex-col w-full h-full relative z-10 px-6 sm:px-12 md:px-10 py-2 md:py-4">
                
                {/* Top Row: Actions (First row, part of document flow, always visible) */}
                <div className="flex justify-end w-full pb-4">
                    <div className="flex gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full px-3 py-2 shadow-sm border border-border-default/50">
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="hover:text-accent-primary text-text-tertiary transition-colors" title="Edit">
                            <Edit2 size={16}/>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if (activeExam?.id && activeExam.id !== 'legacy') togglePauseExam(activeExam.id); }} className="hover:text-accent-primary text-text-tertiary transition-colors" title={activeExam?.isPaused ? "Resume" : "Pause"}>
                            {activeExam?.isPaused ? <Play size={16}/> : <Pause size={16}/>}
                        </button>
                        <button onClick={(e) => { 
                            e.stopPropagation(); 
                            if (activeExam?.id && activeExam.id !== 'legacy') { deleteExam(activeExam.id); setCurrentIndex(0); } 
                            else { setExamDate(null); setExamName(''); } 
                        }} className="hover:text-red-500 text-text-tertiary transition-colors" title="Delete">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>

                {/* Main Content: Countdown on Left */}
                <div className="flex items-center w-full flex-1">
                    <div className="flex flex-col items-start justify-center w-auto">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl md:text-6xl font-black text-text-primary tabular-nums tracking-tighter">
                                {daysLeft > 0 ? daysLeft : 0}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-1 mb-3">Days Left</span>
                        
                        <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            activeExam?.isPaused ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20' : daysLeft <= 7 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                        }`}>
                            {activeExam?.isPaused ? 'Paused' : daysLeft <= 0 ? 'Exam Day' : daysLeft <= 7 ? 'Urgent' : 'On Track'}
                        </div>
                    </div>
                </div>
            </div>
        </CardContainer>
    );

    // ==========================================
    // MODAL RENDERS (Edit View)
    // ==========================================
    return (
        <>
            {!isEditing ? unexpandedWidget : (
               <div className="w-full">
                  <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Edit Exam Details</h2>
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
                              <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)} className={`w-full bg-transparent outline-none text-sm font-medium ${!tempDate ? 'text-gray-400 dark:text-gray-500' : 'text-current'}`} />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-text-tertiary uppercase block mb-1">Link Space</label>
                          <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 items-center gap-3">
                              <BookOpen size={18} className="text-accent-primary" />
                              <select value={selectedSpaceId} onChange={e=>setSelectedSpaceId(e.target.value)} className={`w-full bg-transparent outline-none text-sm font-medium appearance-none ${!selectedSpaceId ? 'text-gray-400 dark:text-gray-500' : 'text-current'}`}>
                                  <option value="" className="text-black dark:text-white">Do not link</option>
                                  {customSpaces.map(sp => <option key={sp.id} value={sp.id} className="text-black dark:text-white">{sp.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                          <button onClick={() => setIsEditing(false)} className="px-5 py-2 font-semibold text-text-secondary bg-neutral-100 dark:bg-zinc-800 rounded-xl">Cancel</button>
                          <button onClick={handleSave} disabled={!tempDate} className="px-5 py-2 font-bold text-white bg-accent-primary rounded-xl disabled:opacity-50">Save Exam</button>
                      </div>
                  </div>
               </div>
            )}
        </>
    );
};

export default ExamReminder;
