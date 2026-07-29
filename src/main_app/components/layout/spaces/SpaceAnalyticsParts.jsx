import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CaretLeft, CaretRight, CaretDown, Check, Lightning, Brain, Target, TrendUp, Warning, ArrowRight, Sparkle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../ui/Card';

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
        <CaretDown size={14} weight="bold" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'rgb(var(--text-tertiary))' }} />
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
                {String(value) === String(opt.id) && <Check size={14} weight="bold" />}
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
// Card 1 — Course Coverage
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

  const sorts = [['most', 'Most read'], ['least', 'Least read'], ['recent', 'Recent'], ['az', 'A–Z']];

  return (
    <Card className="p-6 w-full min-w-0">
      {PARTS_STYLES}
      <div className="cc-header">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))', letterSpacing: '-0.01em' }}>Course coverage</span>
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
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7F77DD' }}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

import db from '../../../db/apex.db';

// ═══════════════════════════════════════
// Card 1b — Study Time This Week
// ═══════════════════════════════════════
export const StudyTimeCard = React.memo(({ weeklyTime = [], readingTimeHistory = {}, rawActivity = [], spaceBooks = [] }) => {
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayJS = new Date();
  const todayLabel = todayJS.toLocaleDateString('en-US', { weekday: 'short' });
  const todayIdx = dayOrder.indexOf(todayLabel);

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [collapsed, setCollapsed] = useState({ Morning: false, Afternoon: false, Evening: true });
  const [localReadingTime, setLocalReadingTime] = useState({});

  // Fetch local Dexie reading time for offline & unsynced resilience
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!db?.book_reading_time) return;
        const records = await db.book_reading_time.toArray();
        if (!active) return;
        const map = {};
        records.forEach(r => {
          if (!r.date || !r.minutes) return;
          if (!map[r.date]) map[r.date] = { minutes: 0, by_book: {} };
          const key = r.supabaseBookId || (r.bookId ? String(r.bookId) : 'unknown');
          // Deduplicate multiple entries for the same book and date in Dexie (take highest)
          map[r.date].by_book[key] = Math.max(map[r.date].by_book[key] || 0, r.minutes);
        });
        // Calculate total per day from by_book values
        Object.keys(map).forEach(d => {
          map[d].minutes = Object.values(map[d].by_book).reduce((a, b) => a + b, 0);
        });
        setLocalReadingTime(map);
      } catch (err) {
        console.error('[StudyTimeCard] Error reading local book_reading_time:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Compute Monday of the viewed week
  const dow = todayJS.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(todayJS.getFullYear(), todayJS.getMonth(), todayJS.getDate() + mondayOffset + (weekOffset * 7));
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

  const isCurrentWeek = weekOffset === 0;
  const isFutureWeek = weekOffset > 0;

  const fmtWeekDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRange = `${fmtWeekDate(monday)} – ${fmtWeekDate(sunday)}`;

  // Reset selected day when changing weeks
  const prevWeek = () => {
    setWeekOffset(w => w - 1);
    setSelectedDayIdx(6);
    setCollapsed({ Morning: false, Afternoon: false, Evening: true });
  };
  const nextWeek = () => {
    if (isFutureWeek) return;
    const nextOffset = weekOffset + 1;
    setWeekOffset(nextOffset);
    setSelectedDayIdx(nextOffset === 0 ? (todayIdx >= 0 ? todayIdx : 0) : 0);
    setCollapsed({ Morning: false, Afternoon: false, Evening: true });
  };

  // Set of allowed book IDs for scope filtering (book-level vs space-level vs global)
  const allowedBookIdSet = useMemo(() => {
    if (!spaceBooks || spaceBooks.length === 0) return null;
    const set = new Set();
    spaceBooks.forEach(b => {
      if (b) {
        if (b.supabaseId) set.add(String(b.supabaseId));
        if (b.recordId) set.add(String(b.recordId));
        if (b.id !== undefined && b.id !== null) set.add(String(b.id));
      }
    });
    return set.size > 0 ? set : null;
  }, [spaceBooks]);

  const calcMinsForAllowedBooks = useMemo(() => {
    return (byBookObj) => {
      if (!byBookObj) return { totalMins: 0, filteredByBook: {} };
      if (!allowedBookIdSet) {
        const totalMins = Object.values(byBookObj).reduce((sum, m) => sum + (m || 0), 0);
        return { totalMins, filteredByBook: { ...byBookObj } };
      }
      let totalMins = 0;
      const filteredByBook = {};
      Object.entries(byBookObj).forEach(([bId, mins]) => {
        if (allowedBookIdSet.has(String(bId))) {
          totalMins += (mins || 0);
          filteredByBook[bId] = mins;
        }
      });
      return { totalMins, filteredByBook };
    };
  }, [allowedBookIdSet]);

  // Compute weekly time for current or past weeks dynamically from readingTimeHistory, localReadingTime, or weeklyTime
  const displayWeeklyTime = useMemo(() => {
    const todayDateStr = toDateStr(todayJS);

    return dayOrder.map((dName, idx) => {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
      const dayStr = toDateStr(dayDate);
      const isPastDay = dayStr < todayDateStr; // strictly past date

      // Server readingTimeHistory entry
      const serverDayData = readingTimeHistory ? readingTimeHistory[dayStr] : null;

      // Local Dexie reading time entry
      const localDayData = localReadingTime ? localReadingTime[dayStr] : null;

      // Fallback currentWeekData from weeklyTime array
      const currentWeekData = (isCurrentWeek && weeklyTime && weeklyTime[idx]) ? weeklyTime[idx] : null;

      let trueMins = 0;
      let byBook = {};

      if (serverDayData) {
        const { totalMins, filteredByBook } = calcMinsForAllowedBooks(serverDayData.by_book);
        trueMins = totalMins;
        byBook = filteredByBook;
      } else if (currentWeekData) {
        const { totalMins, filteredByBook } = calcMinsForAllowedBooks(currentWeekData.by_book);
        trueMins = totalMins;
        byBook = filteredByBook;
      }

      // Dexie override only applies to TODAY (live unsynced session)
      // For past days, server data is authoritative
      if (localDayData && !isPastDay) {
        const { totalMins: localMins, filteredByBook: localByBook } = calcMinsForAllowedBooks(localDayData.by_book);
        trueMins = Math.max(trueMins, localMins);
        Object.entries(localByBook).forEach(([bId, mins]) => {
          byBook[bId] = Math.max(byBook[bId] || 0, mins);
        });
      }

      // Fallback: if server data missing entirely for a past day, use Dexie as last resort
      if (isPastDay && trueMins === 0 && localDayData) {
        const { totalMins: localMins, filteredByBook: localByBook } = calcMinsForAllowedBooks(localDayData.by_book);
        if (localMins > 0) {
          trueMins = localMins;
          byBook = localByBook;
        }
      }

      // Fallback: check rawActivity for explicit logged minutes if no reading_time entry exists
      const dayEvents = (rawActivity || []).filter(
        ev => (ev.type === 'reading' || ev.type === 'study' || ev.type === 'quiz') &&
              ev.timestamp?.slice(0, 10) === dayStr &&
              (!allowedBookIdSet || allowedBookIdSet.has(String(ev.book_id)))
      );

      let calcMins = 0;
      dayEvents.forEach(ev => {
        if (ev.minutes) {
          calcMins += ev.minutes;
          const bId = ev.book_id || 'unknown';
          byBook[bId] = Math.max(byBook[bId] || 0, ev.minutes);
        }
      });

      const finalMins = Math.max(trueMins, calcMins);

      return {
        day: dName,
        dateStr: dayStr,
        minutes: finalMins,
        by_book: byBook,
      };
    });
  }, [dayOrder, monday, isCurrentWeek, weeklyTime, rawActivity, readingTimeHistory, localReadingTime, todayJS, calcMinsForAllowedBooks, allowedBookIdSet]);

  // Actual date string for selected day
  const selectedDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + selectedDayIdx);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(todayJS);

  const selectedDayLabel = useMemo(() => {
    if (selectedDateStr === todayStr) return 'Today';
    const yesterday = new Date(todayJS); yesterday.setDate(todayJS.getDate() - 1);
    if (selectedDateStr === toDateStr(yesterday)) return 'Yesterday';
    return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDateStr, todayStr]);

  // Filter reading events for selected day
  const dayReadingSessions = useMemo(() => {
    if (!rawActivity) return [];
    return rawActivity
      .filter(ev => ev.type === 'reading' && ev.timestamp?.slice(0, 10) === selectedDateStr && (!allowedBookIdSet || allowedBookIdSet.has(String(ev.book_id))))
      .map(ev => {
        const book = spaceBooks?.find(b => (b.supabaseId || b.recordId || String(b.id)) === ev.book_id || String(b.id) === String(ev.book_id));
        const pages = parseInt(ev.detail) || 0;
        return {
          ...ev,
          bookTitle: book?.title || 'Unknown Book',
          estimatedMins: Math.round(pages * 0.5),
          hour: new Date(ev.timestamp).getHours(),
        };
      });
  }, [rawActivity, selectedDateStr, spaceBooks, allowedBookIdSet]);

  const dayTotalMins = dayReadingSessions.reduce((s, ev) => s + ev.estimatedMins, 0);
  const actualDayTotalMins = displayWeeklyTime[selectedDayIdx]?.minutes || 0;

  // Group by segment → bundle by book
  const segments = useMemo(() => {
    const segs = { Morning: [], Afternoon: [], Evening: [] };
    
    const actualDayData = displayWeeklyTime[selectedDayIdx] || {};
    const actualByBook = actualDayData.by_book || {};

    if (dayReadingSessions.length === 0 && actualDayData.minutes > 0) {
      // If no raw activity logs exist for a past day, synthesize session entries from actualByBook
      Object.entries(actualByBook).forEach(([bId, mins]) => {
        if (mins <= 0) return;
        if (allowedBookIdSet && !allowedBookIdSet.has(String(bId))) return;
        const book = spaceBooks?.find(b => (b.supabaseId || b.recordId || String(b.id)) === bId || String(b.id) === String(bId));
        segs.Afternoon.push({
          bookTitle: book?.title || 'Book reading session',
          scaledMins: mins,
          hour: 14,
        });
      });
    } else {
      // Calculate total estimated minutes PER BOOK for the day
      const estimatedTotalByBook = {};
      dayReadingSessions.forEach(ev => {
        estimatedTotalByBook[ev.book_id] = (estimatedTotalByBook[ev.book_id] || 0) + ev.estimatedMins;
      });

      const scaledSessions = dayReadingSessions.map(ev => {
        let scaledMins = ev.estimatedMins;
        const actualBookMins = actualByBook[ev.book_id] || 0;
        const estimatedBookMins = estimatedTotalByBook[ev.book_id] || 0;

        if (actualBookMins > 0) {
          if (estimatedBookMins > 0) {
            scaledMins = ev.estimatedMins * (actualBookMins / estimatedBookMins);
          } else {
            const bookSessionsCount = dayReadingSessions.filter(s => s.book_id === ev.book_id).length;
            scaledMins = actualBookMins / (bookSessionsCount || 1);
          }
        } else {
          scaledMins = ev.estimatedMins || 0;
        }
        
        return { ...ev, scaledMins };
      });

      scaledSessions.forEach(ev => {
        if (ev.hour < 12) segs.Morning.push(ev);
        else if (ev.hour < 18) segs.Afternoon.push(ev);
        else segs.Evening.push(ev);
      });
    }

    const bundleByBook = (events) => {
      const byBook = {};
      events.forEach(ev => {
        if (!byBook[ev.bookTitle]) byBook[ev.bookTitle] = { bookTitle: ev.bookTitle, totalMins: 0 };
        byBook[ev.bookTitle].totalMins += ev.scaledMins;
      });
      return Object.values(byBook).map(b => ({ ...b, totalMins: Math.round(b.totalMins) }));
    };

    return {
      Morning: bundleByBook(segs.Morning),
      Afternoon: bundleByBook(segs.Afternoon),
      Evening: bundleByBook(segs.Evening),
    };
  }, [dayReadingSessions, actualDayTotalMins, dayTotalMins, displayWeeklyTime, selectedDayIdx, spaceBooks]);

  // Histogram values
  const totalMins = displayWeeklyTime.reduce((s, d) => s + d.minutes, 0);
  const maxMins = Math.max(...displayWeeklyTime.map(d => d.minutes), 1);
  const CHART_H = 80;
  const Y_LABEL_W = 28;
  const topTick = Math.ceil(maxMins / 30) * 30 || 30;
  const yTicks = [0, Math.round(topTick / 2), topTick];

  const segMeta = [
    { name: 'Morning', range: '12:00 AM – 12:00 PM', dot: '#7F77DD' },
    { name: 'Afternoon', range: '12:00 PM – 6:00 PM', dot: '#E5C07B' },
    { name: 'Evening', range: '6:00 PM – 12:00 AM', dot: '#534AB7' },
  ];

  const toggleSeg = (name) => setCollapsed(p => ({ ...p, [name]: !p[name] }));

  return (
    <Card className="p-6 w-full min-w-0">
      {PARTS_STYLES}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))', letterSpacing: '-0.01em' }}>
          Study time this week
        </span>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#7F77DD', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {fmtTime(totalMins)}
        </span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 500, color: 'rgb(var(--text-tertiary))', letterSpacing: '0.02em' }}>
        {weekRange}
      </span>

      {/* Chart area */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: Y_LABEL_W, flexShrink: 0, position: 'relative', height: CHART_H }}>
          {yTicks.map(tick => (
            <span key={tick} style={{
              position: 'absolute', bottom: `${(tick / topTick) * 100}%`, right: 4,
              transform: 'translateY(50%)', fontSize: 9, fontWeight: 600,
              color: 'rgb(var(--text-tertiary))', lineHeight: 1,
            }}>
              {tick === 0 ? '' : `${tick}m`}
            </span>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative', height: CHART_H }}>
          {yTicks.map(tick => (
            <div key={`g-${tick}`} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: `${(tick / topTick) * 100}%`,
              borderTop: tick === 0
                ? '1px solid rgb(var(--text-tertiary) / 0.2)'
                : '1px dashed rgb(var(--text-tertiary) / 0.1)',
            }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%', position: 'relative', zIndex: 2, paddingLeft: 4, paddingRight: 4 }}>
            {displayWeeklyTime.map((d, i) => {
              const isSelected = i === selectedDayIdx;
              const isFutureDay = isCurrentWeek && dayOrder.indexOf(d.day) > todayIdx;
              const h = maxMins > 0 ? (d.minutes / topTick) * CHART_H : 0;
              const barColor = (d.minutes === 0 || isFutureDay)
                ? 'rgb(var(--bg-subtle))'
                : isSelected ? '#534AB7' : '#AFA9EC';
              const clickable = !isFutureDay && !isFutureWeek;
              return (
                <div key={d.day} onClick={() => clickable && setSelectedDayIdx(i)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: clickable ? 'pointer' : 'default' }}>
                  {d.minutes > 0 && !isFutureDay && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: barColor, marginBottom: 3 }}>{fmtTime(d.minutes)}</span>
                  )}
                  <div style={{
                    width: '100%', maxWidth: 32,
                    height: Math.max(h, d.minutes > 0 && !isFutureDay ? 4 : 0),
                    background: barColor, borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease',
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day labels + week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
        <button onClick={prevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgb(var(--text-tertiary))', flexShrink: 0, width: Y_LABEL_W, display: 'flex', justifyContent: 'center' }}>
          <CaretLeft size={14} weight="bold" />
        </button>
        <div style={{ flex: 1, display: 'flex' }}>
          {displayWeeklyTime.map((d, i) => {
            const isFutureDay = isCurrentWeek && dayOrder.indexOf(d.day) > todayIdx;
            const clickable = !isFutureDay && !isFutureWeek;
            return (
              <div key={d.day} onClick={() => clickable && setSelectedDayIdx(i)}
                style={{
                  flex: 1, textAlign: 'center', fontSize: 9, cursor: clickable ? 'pointer' : 'default',
                  fontWeight: i === selectedDayIdx ? 700 : 500,
                  color: i === selectedDayIdx ? '#7F77DD' : 'rgb(var(--text-tertiary))',
                }}>
                {d.day}
              </div>
            );
          })}
        </div>
        <button onClick={nextWeek} disabled={isFutureWeek} style={{ background: 'none', border: 'none', cursor: isFutureWeek ? 'default' : 'pointer', padding: 2, color: isFutureWeek ? 'rgb(var(--text-tertiary) / 0.3)' : 'rgb(var(--text-tertiary))', flexShrink: 0, width: 20, display: 'flex', justifyContent: 'center' }}>
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* ── Daily Reading Log ── */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgb(var(--border-default) / 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', fontStyle: 'italic' }}>
            {selectedDayLabel}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgb(var(--text-tertiary))' }}>
            {actualDayTotalMins > 0 ? `${fmtTime(actualDayTotalMins)} studied` : ''}
          </span>
        </div>

        {dayReadingSessions.length === 0 ? (
          <p style={{ fontSize: 11, color: 'rgb(var(--text-tertiary))', textAlign: 'center', padding: '16px 0' }}>No reading sessions recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {segMeta.map(seg => {
              const items = segments[seg.name] || [];
              if (items.length === 0) return null;
              const isOpen = !collapsed[seg.name];
              return (
                <div key={seg.name}>
                  <button onClick={() => toggleSeg(seg.name)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-primary))',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: seg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, flex: 1, textAlign: 'left' }}>{seg.name}</span>
                    <span style={{ fontSize: 9, color: 'rgb(var(--text-tertiary))', fontWeight: 500 }}>{seg.range}</span>
                    <span style={{ fontSize: 9, color: 'rgb(var(--text-tertiary))', fontWeight: 600, marginLeft: 4 }}>{items.length}</span>
                    <CaretDown size={12} weight="bold" style={{ color: 'rgb(var(--text-tertiary))', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>
                  {isOpen && (
                    <div style={{ paddingLeft: 20, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#AFA9EC', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: 'rgb(var(--text-secondary))' }}>
                            {item.bookTitle}
                            <span style={{ color: 'rgb(var(--text-tertiary))' }}> · {fmtTime(item.totalMins)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
});


// ═══════════════════════════════════════
// Card 2 — Quiz Performance
// ═══════════════════════════════════════
export const QuizCard = React.memo(({ enrichedBooks, quizStats, localBookTrends, spaceBooks, showSelect = true }) => {
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
    <Card className="p-6 w-full min-w-0">
      {PARTS_STYLES}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Quiz performance</span>
        {showSelect && (
          <CustomSelect
            value={selectedBook}
            onChange={setSelectedBook}
            options={[{ id: 'overall', title: 'Overall' }, ...enrichedBooks]}
          />
        )}
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
    </Card>
  );
});

// ═══════════════════════════════════════
// Card 3 — Calendar + Activity Log
// ═══════════════════════════════════════
// ═══════════════════════════════════════
export const CalendarActivityCard = React.memo(({ streakHistory = [], currentStreak = 0, rawActivity = [], spaceBooks = [], readingTimeHistory = {} }) => {
  const todayStr = toDateStr(new Date());
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [calDate, setCalDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState({ Morning: false, Afternoon: false, Evening: true });
  const [localReadingTime, setLocalReadingTime] = useState({});

  // Fetch local Dexie reading time for offline resilience
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!db?.book_reading_time) return;
        const records = await db.book_reading_time.toArray();
        if (!active) return;
        const map = {};
        records.forEach(r => {
          if (!r.date || !r.minutes) return;
          if (!map[r.date]) map[r.date] = { minutes: 0, by_book: {} };
          const key = r.supabaseBookId || (r.bookId ? String(r.bookId) : 'unknown');
          map[r.date].by_book[key] = Math.max(map[r.date].by_book[key] || 0, r.minutes);
        });
        Object.keys(map).forEach(d => {
          map[d].minutes = Object.values(map[d].by_book).reduce((a, b) => a + b, 0);
        });
        setLocalReadingTime(map);
      } catch (err) {
        console.error('[CalendarActivityCard] Error reading local book_reading_time:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Allowed book IDs for scope filtering (Book-level vs Space-level vs Global-level)
  const allowedBookIdSet = useMemo(() => {
    if (!spaceBooks || spaceBooks.length === 0) return null;
    const set = new Set();
    spaceBooks.forEach(b => {
      if (b) {
        if (b.supabaseId) set.add(String(b.supabaseId));
        if (b.recordId) set.add(String(b.recordId));
        if (b.id !== undefined && b.id !== null) set.add(String(b.id));
      }
    });
    return set.size > 0 ? set : null;
  }, [spaceBooks]);

  // Compute set of active study dates specifically for the current scope
  const activeDatesSet = useMemo(() => {
    const dates = new Set();

    // 1. Check server readingTimeHistory
    if (readingTimeHistory) {
      Object.entries(readingTimeHistory).forEach(([dStr, dayData]) => {
        if (!dayData?.by_book) return;
        if (!allowedBookIdSet) {
          if ((dayData.minutes || 0) > 0) dates.add(dStr);
        } else {
          const hasBookMins = Object.entries(dayData.by_book).some(([bId, mins]) => (mins || 0) > 0 && allowedBookIdSet.has(String(bId)));
          if (hasBookMins) dates.add(dStr);
        }
      });
    }

    // 2. Check local Dexie reading time
    if (localReadingTime) {
      Object.entries(localReadingTime).forEach(([dStr, dayData]) => {
        if (!dayData?.by_book) return;
        if (!allowedBookIdSet) {
          if ((dayData.minutes || 0) > 0) dates.add(dStr);
        } else {
          const hasBookMins = Object.entries(dayData.by_book).some(([bId, mins]) => (mins || 0) > 0 && allowedBookIdSet.has(String(bId)));
          if (hasBookMins) dates.add(dStr);
        }
      });
    }

    // 3. Check rawActivity events (reading sessions, quizzes, notes, highlights)
    if (rawActivity && Array.isArray(rawActivity)) {
      rawActivity.forEach(ev => {
        if (!ev || !ev.timestamp || typeof ev.timestamp !== 'string') return;
        const dStr = ev.timestamp.slice(0, 10);
        if (!allowedBookIdSet || (ev.book_id && allowedBookIdSet.has(String(ev.book_id)))) {
          dates.add(dStr);
        }
      });
    }

    // 4. If global level (allowedBookIdSet is null), also include global streakHistory
    if (!allowedBookIdSet && streakHistory && Array.isArray(streakHistory)) {
      streakHistory.forEach(dStr => {
        if (typeof dStr === 'string' && dStr.length >= 10) {
          dates.add(dStr.slice(0, 10));
        }
      });
    }

    return dates;
  }, [readingTimeHistory, localReadingTime, rawActivity, streakHistory, allowedBookIdSet]);

  // Dynamic consecutive streak computation for current scope
  const displayStreak = useMemo(() => {
    if (activeDatesSet.size === 0) return 0;
    const today = new Date();
    const tStr = toDateStr(today);
    const yDay = new Date(today);
    yDay.setDate(today.getDate() - 1);
    const yStr = toDateStr(yDay);

    let startPoint = null;
    if (activeDatesSet.has(tStr)) startPoint = today;
    else if (activeDatesSet.has(yStr)) startPoint = yDay;
    else return 0;

    let streak = 0;
    let curr = new Date(startPoint);
    while (true) {
      const ds = toDateStr(curr);
      if (activeDatesSet.has(ds)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, currentStreak > 0 && !allowedBookIdSet ? currentStreak : 0);
  }, [activeDatesSet, currentStreak, allowedBookIdSet]);

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

  // Filter activity for selected day (scoped to spaceBooks)
  const dayEvents = useMemo(() => {
    if (!rawActivity) return [];
    return rawActivity.filter(ev => {
      if (!ev || !ev.timestamp || typeof ev.timestamp !== 'string') return false;
      if (ev.timestamp.slice(0, 10) !== selectedDay) return false;
      if (allowedBookIdSet && ev.book_id && !allowedBookIdSet.has(String(ev.book_id))) return false;
      return true;
    }).map(ev => {
      const book = spaceBooks?.find(b => (b.supabaseId || b.recordId || String(b.id)) === ev.book_id || String(b.id) === String(ev.book_id));
      return { ...ev, bookTitle: book?.title || 'Unknown Book' };
    });
  }, [rawActivity, selectedDay, spaceBooks, allowedBookIdSet]);

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

  function bundleEvents(events) {
    const quizEvents = events.filter(e => e.type === 'quiz');
    const bundleable = events.filter(e => e.type !== 'quiz');

    // Group by book + normalised type
    const groups = {};
    bundleable.forEach(e => {
      const typeKey = ['note', 'manual_note'].includes(e.type) ? 'note'
        : ['ai_explanation', 'ai'].includes(e.type) ? 'ai'
        : e.type; // 'highlight', 'reading'
      const key = `${typeKey}||${e.bookTitle || 'Unknown'}`;
      if (!groups[key]) {
        groups[key] = { type: typeKey, bookTitle: e.bookTitle || 'Unknown', count: 0, earliest: e.timestamp };
      }
      groups[key].count += typeKey === 'reading'
        ? (parseInt(e.detail) || 1)
        : 1;
      if (e.timestamp < groups[key].earliest) groups[key].earliest = e.timestamp;
    });

    const bundled = Object.values(groups).map(g => {
      let label;
      if (g.type === 'note') label = `${g.count} ${g.count === 1 ? 'note' : 'notes'} added`;
      else if (g.type === 'highlight') label = `${g.count} ${g.count === 1 ? 'highlight' : 'highlights'} made`;
      else if (g.type === 'ai') label = `${g.count} ${g.count === 1 ? 'explanation' : 'explanations'} used`;
      else if (g.type === 'reading') label = `${g.count} ${g.count === 1 ? 'page' : 'pages'} read`;
      else label = g.type;
      return { ...g, label, isBundle: true };
    });

    const quizFormatted = quizEvents.map(e => ({
      ...e,
      label: e.detail || 'Quiz completed',
      isBundle: false,
    }));

    return [...bundled, ...quizFormatted].sort((a, b) =>
      new Date(a.earliest || a.timestamp) - new Date(b.earliest || b.timestamp)
    );
  }

  const renderEvents = (events) => {
    const bundles = bundleEvents(events);

    return (
      <div style={{ paddingLeft: 20, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bundles.map((b, i) => {
          let dotColor = '#7F77DD';
          if (b.type === 'note' || b.type === 'manual_note') dotColor = '#10B981';
          if (b.type === 'quiz') dotColor = '#E5C07B';
          if (b.type === 'reading') dotColor = '#AFA9EC';

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgb(var(--text-secondary))' }}>
                {b.label}
                {b.bookTitle && (
                  <span style={{ color: 'rgb(var(--text-tertiary))' }}> · {b.bookTitle}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="flex flex-col w-full min-w-0">
      {/* Calendar */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>Study consistency</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgb(var(--text-tertiary))' }}><CaretLeft size={14} /></button>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgb(var(--text-primary))', minWidth: 100, textAlign: 'center' }}>{monthLabel}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgb(var(--text-tertiary))' }}><CaretRight size={14} /></button>
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
            const hasAct = activeDatesSet.has(cell.dateStr);

            let bg = 'transparent';
            let color = 'rgb(var(--text-tertiary))';
            let border = 'none';
            let boxShadow = 'none';

            if (hasAct) {
              bg = '#7F77DD';
              color = '#ffffff';
            } else if (isToday) {
              color = '#7F77DD';
              border = '1.5px solid #7F77DD';
            }

            if (isSel) {
              if (hasAct) {
                boxShadow = '0 0 0 2px rgb(var(--bg-elevated)), 0 0 0 4px #7F77DD';
              } else {
                bg = 'rgba(127, 119, 221, 0.12)';
                color = '#7F77DD';
                border = '1.5px solid #7F77DD';
              }
            }

            return (
              <div 
                key={cell.dateStr} 
                onClick={() => { setSelectedDay(cell.dateStr); setCollapsed({ Morning: false, Afternoon: false, Evening: true }); }}
                className="cal-cell"
                style={{ background: bg, color, border, boxShadow, fontWeight: (isSel || hasAct || isToday) ? 700 : 500 }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        {displayStreak > 0 && (
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7F77DD', marginTop: 12, textAlign: 'center' }}>{displayStreak}-day streak</p>
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
                    <CaretDown size={12} weight="bold" style={{ color: 'rgb(var(--text-tertiary))', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>
                  {isOpen && renderEvents(items, seg.name)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
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
    <Card className="overflow-hidden">
      {PARTS_STYLES}
      <div style={{ padding: 24, borderBottom: '1px solid rgb(var(--border-default) / 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={18} color="#7F77DD" />
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
                  <TrendUp size={12} color="#10B981" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgb(var(--text-primary))' }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--border-default) / 0.3)', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.03), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Warning size={14} color="#F59E0B" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Focus</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.weak.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))' }}>{item.topic}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendUp size={12} color="#F59E0B" style={{ transform: 'rotate(180deg)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgb(var(--text-primary))' }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Plan */}
        <div style={{ padding: 24, background: 'rgba(127, 119, 221, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkle size={14} color="#7F77DD" />
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
    </Card>
  );
});
