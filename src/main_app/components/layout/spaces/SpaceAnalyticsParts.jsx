import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Zap, BrainCircuit, Target, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── CUSTOM SELECT COMPONENT ──
const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.id) === String(value)) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 50 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8,
          background: 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border-default) / 0.5)',
          cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgb(var(--text-secondary))',
          transition: 'all 0.2s', minWidth: 140, justifyContent: 'space-between'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOption.title}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'rgb(var(--text-tertiary))' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '115%', right: 0, width: 220,
              background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border-default) / 0.8)',
              borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: 6,
              maxHeight: 240, overflowY: 'auto'
            }}
            className="custom-scrollbar"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
                  background: String(value) === String(opt.id) ? 'rgba(127,119,221,0.1)' : 'transparent',
                  color: String(value) === String(opt.id) ? '#7F77DD' : 'rgb(var(--text-secondary))',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, fontWeight: 500, transition: 'background 0.15s'
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.title}</div>
                {String(value) === String(opt.id) && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Helpers ──
const BOOK_COLORS = ['#7F77DD', '#E06C75', '#61AFEF', '#E5C07B', '#98C379', '#C678DD', '#56B6C2', '#D19A66'];
function bookInitials(title) {
  if (!title) return '??';
  const words = title.split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || '') + (words[1]?.[0] || '');
}
function fmtTime(mins) {
  if (!mins || mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function fmtShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtClockTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function toDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export const PARTS_STYLES = (
  <style>{`
    .cc-header {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    @media (min-width: 768px) {
      .cc-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .quiz-pill-label {
      font-size: 9px;
      letter-spacing: 0.12em;
      color: rgb(var(--text-tertiary));
      text-transform: uppercase;
      margin-bottom: 4px;
      font-weight: 600;
      transition: font-size 0.2s;
    }
    .quiz-pill-value {
      font-size: 14px;
      font-weight: 800;
      color: rgb(var(--text-primary));
      transition: font-size 0.2s;
    }
    @media (min-width: 768px) {
      .quiz-pill-label { font-size: 11px; }
      .quiz-pill-value { font-size: 18px; }
    }

    .total-time-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgb(var(--border-default) / 0.4);
    }
    .total-time-value {
      font-size: 24px;
      font-weight: 900;
      color: #7F77DD;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .total-time-label {
      font-size: 10px;
      font-weight: 700;
      color: rgb(var(--text-tertiary));
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 4px;
    }
    @media (min-width: 768px) {
      .total-time-value { font-size: 32px; }
      .total-time-label { font-size: 11px; }
    }

    .cal-cell {
      aspect-ratio: 1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      width: 100%;
      max-width: 38px;
      margin: 0 auto;
      user-select: none;
    }
  `}</style>
);

// ═══════════════════════════════════════
// Card 1 — Course Coverage & Time
// ═══════════════════════════════════════
export const CoverageCard = React.memo(({ enrichedBooks }) => {
  const [sortMode, setSortMode] = useState('most');

  const sorted = useMemo(() => {
    const list = [...enrichedBooks];
    switch (sortMode) {
      case 'most': return list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
      case 'least': return list.sort((a, b) => (a.progress || 0) - (b.progress || 0));
      case 'recent': return list.sort((a, b) => {
        if (!b.lastReadAt) return -1; if (!a.lastReadAt) return 1;
        return new Date(b.lastReadAt) - new Date(a.lastReadAt);
      });
      case 'az': return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default: return list;
    }
  }, [enrichedBooks, sortMode]);

  const totalMins = enrichedBooks.reduce((s, b) => s + (b.timeSpent || 0), 0);
  const sorts = [['most', 'Most read'], ['least', 'Least read'], ['recent', 'Recent'], ['az', 'A–Z']];

  return (
    <div style={{ background: 'rgb(var(--bg-elevated))', border: '0.5px solid rgb(var(--border-default) / 0.5)', borderRadius: 16, padding: 24 }}>
      {PARTS_STYLES}
      <div className="cc-header">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))', letterSpacing: '-0.01em' }}>Course coverage & time</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {sorts.map(([k, label]) => (
            <button key={k} onClick={() => setSortMode(k)} style={{
              fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: sortMode === k ? '#7F77DD' : 'rgb(var(--bg-subtle))',
              color: sortMode === k ? '#fff' : 'rgb(var(--text-tertiary))',
              letterSpacing: '0.02em',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 380, overflowY: 'auto' }} className="custom-scrollbar">
        {sorted.map((book, i) => {
          const pct = Math.round(book.progress || 0);
          const color = BOOK_COLORS[i % BOOK_COLORS.length];
          return (
            <div key={book.id || i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color + '22', color, fontSize: 12, fontWeight: 800, flexShrink: 0, letterSpacing: '0.02em',
              }}>{bookInitials(book.title)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                <div style={{ height: 3, borderRadius: 3, background: 'rgb(var(--bg-subtle))', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#7F77DD', borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7F77DD' }}>{pct}%</span>
                  <span style={{ fontSize: 10, color: 'rgb(var(--text-tertiary))' }}>{fmtTime(book.timeSpent)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="total-time-container">
        <span className="total-time-value">{fmtTime(totalMins)}</span>
        <span className="total-time-label">Total study time</span>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════
// Card 2 — Quiz Performance
// ═══════════════════════════════════════
export const QuizCard = React.memo(({ enrichedBooks, quizStats, localBookTrends, spaceBooks }) => {
  const [selectedBook, setSelectedBook] = useState('overall');

  // Derive per-book quiz stats from analyticsData enrichedBooks
  const currentStats = useMemo(() => {
    if (selectedBook === 'overall') {
      return { avg: quizStats.average_score || 0, best: quizStats.best_score || 0, attempts: quizStats.attempts_count || 0 };
    }
    const book = enrichedBooks.find(b => String(b.id) === String(selectedBook));
    if (!book) return { avg: 0, best: 0, attempts: 0 };
    return { avg: book.averageScore || 0, best: book.bestScore || 0, attempts: book.quizAttempts || 0 };
  }, [selectedBook, enrichedBooks, quizStats]);

  // Get trend data — handles both old format (plain numbers) and new ({score, date} objects)
  const bars = useMemo(() => {
    const key = selectedBook === 'overall' ? 'overall' : selectedBook;
    const trend = localBookTrends[key] || localBookTrends['overall'] || [];
    // Normalize: old format is [number, ...], new format is [{score, date}, ...]
    const normalized = trend.map(e => {
      if (typeof e === 'number') return { score: e, date: null };
      if (e && typeof e === 'object') return { score: e.score ?? 0, date: e.date ?? null };
      return null;
    }).filter(Boolean);
    const nonZero = normalized.filter(e => e.score > 0);
    const last5 = nonZero.slice(-5);
    console.log(`[SpaceAnalytics] Quiz bars rendering for book: ${selectedBook}, attempts: ${last5.length}`);
    return last5;
  }, [selectedBook, localBookTrends]);

  const avg = bars.length > 0 ? bars.reduce((s, b) => s + b.score, 0) / bars.length : 0;
  const maxScore = 100;
  const H = 120;
  const yTicks = [0, 20, 40, 60, 80, 100];
  const Y_LABEL_W = 36;

  const pills = [
    { label: 'AVG SCORE', value: `${Math.round(currentStats.avg)}%` },
    { label: 'BEST SCORE', value: `${Math.round(currentStats.best)}%` },
    { label: 'ATTEMPTS', value: currentStats.attempts },
  ];

  // Format date for bar labels
  const fmtBarDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ background: 'rgb(var(--bg-elevated))', border: '0.5px solid rgb(var(--border-default) / 0.5)', borderRadius: 16, padding: 24 }}>
      {PARTS_STYLES}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Quiz performance</span>
        <CustomSelect
          value={selectedBook}
          onChange={setSelectedBook}
          options={[{ id: 'overall', title: 'Overall' }, ...enrichedBooks]}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {pills.map(p => (
          <div key={p.label} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgb(var(--bg-subtle))', textAlign: 'center',
          }}>
            <div className="quiz-pill-label">{p.label}</div>
            <div className="quiz-pill-value">{p.value}</div>
          </div>
        ))}
      </div>

      {bars.length > 0 ? (
        <div>
          {/* Chart area with Y-axis */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Y-axis labels */}
            <div style={{ width: Y_LABEL_W, flexShrink: 0, position: 'relative', height: H }}>
              {yTicks.map(tick => (
                <span key={tick} style={{
                  position: 'absolute', bottom: `${(tick / maxScore) * 100}%`, right: 6,
                  transform: 'translateY(50%)', fontSize: 9, fontWeight: 600,
                  color: 'rgb(var(--text-tertiary))', lineHeight: 1
                }}>{tick}%</span>
              ))}
            </div>

            {/* Chart body */}
            <div style={{ flex: 1, position: 'relative', height: H }}>
              {/* Horizontal gridlines */}
              {yTicks.map(tick => (
                <div key={`grid-${tick}`} style={{
                  position: 'absolute', left: 0, right: 0, bottom: `${(tick / maxScore) * 100}%`,
                  borderTop: tick === 0 ? '1px solid rgb(var(--text-tertiary) / 0.2)' : '1px dashed rgb(var(--text-tertiary) / 0.1)',
                }} />
              ))}

              {/* Average dashed line */}
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: `${(avg / maxScore) * 100}%`,
                borderTop: '1.5px dashed #7F77DD55', zIndex: 1,
              }} />

              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: '100%', position: 'relative', zIndex: 2, paddingLeft: 4, paddingRight: 4 }}>
                {bars.map((b, i) => {
                  const h = (b.score / maxScore) * H;
                  let barColor = '#AFA9EC';
                  if (b.score >= avg) barColor = '#7F77DD';
                  const isMax = b.score === Math.max(...bars.map(x => x.score));
                  if (isMax) barColor = '#534AB7';
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: barColor, marginBottom: 4 }}>{Math.round(b.score)}%</span>
                      <div style={{ width: '100%', maxWidth: 40, height: h, background: barColor, borderRadius: '5px 5px 0 0', transition: 'height 0.3s ease' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date labels */}
          <div style={{ display: 'flex', marginTop: 8, paddingLeft: Y_LABEL_W }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'rgb(var(--text-tertiary))', fontWeight: 500 }}>
                {fmtBarDate(b.date)}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingLeft: Y_LABEL_W }}>
            <div style={{ width: 16, borderTop: '1.5px dashed #7F77DD55' }} />
            <span style={{ fontSize: 10, color: 'rgb(var(--text-tertiary))' }}>average ({Math.round(avg)}%)</span>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'rgb(var(--text-tertiary))', textAlign: 'center', padding: 20 }}>No quiz attempts yet</p>
      )}
    </div>
  );
});

// ═══════════════════════════════════════
// Card 3 — Calendar + Activity Log
// ═══════════════════════════════════════
export const CalendarActivityCard = React.memo(({ streakHistory, currentStreak, rawActivity, spaceBooks }) => {
  const todayStr = toDateStr(new Date());
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [calDate, setCalDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState({ Morning: false, Afternoon: false, Evening: true });

  console.log(`[SpaceAnalytics] Rendering with selectedDay: ${selectedDay}`);

  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

  const year = calDate.getFullYear(), month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr: ds });
  }

  // Day label
  const dayLabel = useMemo(() => {
    if (selectedDay === todayStr) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDay === toDateStr(yesterday)) return 'Yesterday';
    return fmtShortDate(selectedDay);
  }, [selectedDay, todayStr]);

  // Filter activity for selected day
  const dayEvents = useMemo(() => {
    if (!rawActivity) return [];
    const filtered = rawActivity.filter(ev => {
      if (!ev || !ev.timestamp || typeof ev.timestamp !== 'string') return false;
      return ev.timestamp.slice(0, 10) === selectedDay;
    }).map(ev => {
      const book = spaceBooks?.find(b => (b.supabaseId || b.recordId) === ev.book_id);
      return { ...ev, bookTitle: book?.title || 'Unknown Book' };
    });
    console.log(`[SpaceAnalytics] Activity events for selected day: ${filtered.length}`);
    return filtered;
  }, [rawActivity, selectedDay, spaceBooks]);

  // Group into segments
  const segments = useMemo(() => {
    const segs = { Morning: [], Afternoon: [], Evening: [] };
    dayEvents.forEach(ev => {
      const h = new Date(ev.timestamp).getHours();
      if (h < 12) segs.Morning.push(ev);
      else if (h < 18) segs.Afternoon.push(ev);
      else segs.Evening.push(ev);
    });
    return segs;
  }, [dayEvents]);

  const toggleSeg = (name) => setCollapsed(p => ({ ...p, [name]: !p[name] }));

  const segMeta = [
    { name: 'Morning', range: '12:00 AM – 12:00 PM', dot: '#7F77DD' },
    { name: 'Afternoon', range: '12:00 PM – 6:00 PM', dot: '#E5C07B' },
    { name: 'Evening', range: '6:00 PM – 12:00 AM', dot: '#534AB7' },
  ];

  const renderEvents = (events, segName) => {
    // Separate highlights from other events
    const highlights = events.filter(e => e.type === 'highlight');
    const others = events.filter(e => e.type !== 'highlight');

    // Group highlights by book
    const hlByBook = {};
    highlights.forEach(h => {
      const t = h.bookTitle || 'Unknown';
      hlByBook[t] = (hlByBook[t] || 0) + 1;
    });

    return (
      <div style={{ paddingLeft: 20, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(hlByBook).map(([bookTitle, count]) => (
          <div key={`hl-${bookTitle}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#AFA9EC', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgb(var(--text-secondary))' }}>{count} highlights made · {bookTitle}</span>
          </div>
        ))}
        {others.map((ev, i) => {
          const time = fmtClockTime(ev.timestamp);
          let dotColor = '#7F77DD';
          if (ev.type === 'note' || ev.type === 'manual_note') dotColor = '#10B981';
          return (
            <div key={`${ev.type}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgb(var(--text-tertiary))', minWidth: 56, flexShrink: 0, fontWeight: 500 }}>{time}</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 11, color: 'rgb(var(--text-secondary))' }}>
                {ev.type === 'quiz' ? ev.detail : ev.type === 'note' || ev.type === 'manual_note' ? (ev.detail || 'Note added') : (ev.detail || 'Reading session')}
                {ev.bookTitle && <span style={{ color: 'rgb(var(--text-tertiary))' }}> · {ev.bookTitle}</span>}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: 'rgb(var(--bg-elevated))', border: '0.5px solid rgb(var(--border-default) / 0.5)', borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
      {/* Calendar */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Study consistency</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgb(var(--text-tertiary))' }}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgb(var(--text-primary))', minWidth: 100, textAlign: 'center' }}>{monthLabel}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgb(var(--text-tertiary))' }}><ChevronRight size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {weekDays.map((d, i) => (
            <div key={`wd-${i}`} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="cal-cell" />;
            const isToday = cell.dateStr === todayStr;
            const isSel = cell.dateStr === selectedDay;
            const hasAct = streakHistory.includes(cell.dateStr);
            let bg = 'transparent', color = 'rgb(var(--text-tertiary))', border = 'none';
            if (isSel) { bg = '#7F77DD'; color = '#fff'; }
            else if (hasAct) { bg = 'rgba(127,119,221,0.15)'; color = '#7F77DD'; }
            else if (isToday) { border = '1.5px solid #7F77DD'; color = '#7F77DD'; }
            return (
              <div 
                key={cell.dateStr} 
                onClick={() => { setSelectedDay(cell.dateStr); setCollapsed({ Morning: false, Afternoon: false, Evening: true }); }}
                className="cal-cell"
                style={{ background: bg, color, border }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        {currentStreak > 0 && (
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7F77DD', marginTop: 12, textAlign: 'center' }}>{currentStreak}-day streak</p>
        )}
      </div>

      {/* Activity Log — separated by border */}
      <div style={{ borderTop: '1px solid rgb(var(--border-default) / 0.4)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Activity log</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{dayLabel}</span>
        </div>

        {dayEvents.length === 0 ? (
          <p style={{ fontSize: 11, color: 'rgb(var(--text-tertiary))', textAlign: 'center', padding: '24px 0' }}>No study activity recorded for this day.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {segMeta.map(seg => {
              const items = segments[seg.name] || [];
              if (items.length === 0) return null;
              const isOpen = !collapsed[seg.name];
              return (
                <div key={seg.name}>
                  <button onClick={() => toggleSeg(seg.name)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-primary))',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: seg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, flex: 1, textAlign: 'left' }}>{seg.name}</span>
                    <span style={{ fontSize: 9, color: 'rgb(var(--text-tertiary))', fontWeight: 500 }}>{seg.range}</span>
                    <span style={{ fontSize: 9, color: 'rgb(var(--text-tertiary))', fontWeight: 600, marginLeft: 4 }}>{items.length}</span>
                    <ChevronDown size={12} style={{ color: 'rgb(var(--text-tertiary))', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>
                  {isOpen && renderEvents(items, seg.name)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════
// Card 4 — Knowledge Mastery (Strengths & Weaknesses)
// ═══════════════════════════════════════
export const KnowledgeMasteryCard = React.memo(({ spaceBooks, masteryData }) => {
  // MOCK DATA for now since backend doesn't supply topic-level quiz data yet.
  const data = masteryData || {
    strong: [
      { topic: 'Quantum States', score: 92, trend: 'up' },
      { topic: 'Thermodynamics', score: 88, trend: 'up' },
    ],
    weak: [
      { topic: 'Entanglement Theory', score: 45, trend: 'down' },
      { topic: 'Wave Functions', score: 52, trend: 'down' },
    ],
    recommendation: "You're consistently scoring low on Entanglement Theory. I recommend re-reading Chapter 3 and taking a targeted mini-quiz on Bell's Theorem to master these concepts."
  };

  return (
    <div style={{ background: 'rgb(var(--bg-elevated))', border: '0.5px solid rgb(var(--border-default) / 0.5)', borderRadius: 16, overflow: 'hidden' }}>
      {PARTS_STYLES}
      <div style={{ padding: 24, borderBottom: '1px solid rgb(var(--border-default) / 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="#7F77DD" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Knowledge Mastery</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Beta</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgb(var(--text-secondary))', marginTop: 8 }}>Based on your recent quiz performance across this space.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        {/* Strong Areas */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--border-default) / 0.3)', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.03), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Target size={14} color="#10B981" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Strengths</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.strong.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))' }}>{item.topic}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={12} color="#10B981" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgb(var(--text-primary))' }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--border-default) / 0.3)', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.03), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <AlertTriangle size={14} color="#F59E0B" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Focus</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.weak.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))' }}>{item.topic}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={12} color="#F59E0B" style={{ transform: 'rotate(180deg)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgb(var(--text-primary))' }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Plan */}
        <div style={{ padding: 24, background: 'rgba(127, 119, 221, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={14} color="#7F77DD" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cleo's Action Plan</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgb(var(--text-secondary))', lineHeight: 1.6, marginBottom: 16 }}>
            {data.recommendation}
          </p>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', 
            background: '#7F77DD', color: '#fff', borderRadius: 8, border: 'none', 
            fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Generate Custom Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
