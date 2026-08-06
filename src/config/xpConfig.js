/**
 * xpConfig.js -- XP system constants and level computation
 * Step 2 of the Apex gamification build order.
 *
 * Level cost model:
 *   - Costs form a continuous increasing sequence across bands.
 *   - Within a band, level p (1-indexed) costs:  cd * (p + bandOffset)
 *   - bandOffset for the first band (Freshman) = 0
 *   - For each subsequent band B:
 *       bandOffset(B) = lastLevelCost(B-1) / cd(B)
 *     where lastLevelCost(B-1) = cd(B-1) * (10 + offset(B-1))
 *   - This ensures costs are strictly increasing across band boundaries.
 *   - The baseXp values in XP_BANDS are authoritative for band detection;
 *     they are NOT computed from the cost formula -- they are given.
 */

// ─── XP Band Definitions ─────────────────────────────────────────────────────
export const XP_BANDS = [
  { title: 'Freshman',     levels: 10, cd: 170,   baseXp: 0,         startLevel: 1  },
  { title: 'Rookie',       levels: 10, cd: 340,   baseXp: 7650,      startLevel: 11 },
  { title: 'Scholar',      levels: 10, cd: 670,   baseXp: 42350,     startLevel: 21 },
  { title: 'Thinker',      levels: 10, cd: 1200,  baseXp: 131150,    startLevel: 31 },
  { title: 'Achiever',     levels: 10, cd: 1700,  baseXp: 317150,    startLevel: 41 },
  { title: 'Apex Scholar', levels: 10, cd: 2700,  baseXp: 651650,    startLevel: 51 },
  { title: 'Elite',        levels: 10, cd: 4000,  baseXp: 1200650,   startLevel: 61 },
  { title: 'Genius',       levels: 10, cd: 6000,  baseXp: 2100650,   startLevel: 71 },
  { title: 'Master',       levels: 10, cd: 8500,  baseXp: 3500650,   startLevel: 81 },
  { title: 'Legend',       levels: 10, cd: 13000, baseXp: 5600650,   startLevel: 91 },
];

// ─── XP Values ───────────────────────────────────────────────────────────────
export const XP_VALUES = {
  reading_per_minute: 2,       // awarded per minute of reading, min 5 min session
  quest_completion: 20,        // per quest completed
  all_quests_bonus: 20,        // bonus when all 3 quests completed same day
  quiz_min: 20,                // minimum XP for any quiz
  quiz_per_score_point: 1,     // score% x 1, floored at quiz_min
  ai_explanation: 5,           // per AI question asked
  highlight_created: 3,        // per highlight, capped at 20/day for XP
  note_added: 8,               // per note added to highlight, capped at 10/day
  dictionary_lookup: 2,        // per lookup, capped at 15/day
  tab_added: 5,                // per tab/sticky note saved, capped at 15/day
  simplify: 5,                 // per text simplification
  flashcard_generated: 0,
  flashcard_practiced_min: 10,
  flashcard_practiced_per_card: 3,
};

// ─── Daily XP Caps ───────────────────────────────────────────────────────────
export const XP_DAILY_CAPS = {
  highlight_created: 20,
  note_added: 10,
  dictionary_lookup: 15,
  tab_added: 15,
};

// ─── Band offset computation ──────────────────────────────────────────────────
// Precompute the band offsets once at module load.
// offset(0) = 0 for Freshman.
// offset(B) = cd(B-1) * (10 + offset(B-1)) / cd(B)
// Cost of band position p: cd * (p + offset)
const _BAND_OFFSETS = (() => {
  const offsets = [0]; // Freshman offset = 0
  for (let b = 1; b < XP_BANDS.length; b++) {
    const prev = XP_BANDS[b - 1];
    const curr = XP_BANDS[b];
    const lastCost = prev.cd * (10 + offsets[b - 1]);
    offsets.push(lastCost / curr.cd);
  }
  return offsets;
})();

// ─── Sub-Level Mapping ───────────────────────────────────────────────────────
/**
 * getSubLevel(positionInBand) -- returns Roman numeral tier within a band.
 * positionInBand is 1-indexed (1-10).
 *   1-3  => 'I'
 *   4-7  => 'II'
 *   8-10 => 'III'
 */
export function getSubLevel(positionInBand) {
  if (positionInBand <= 3) return 'I';
  if (positionInBand <= 7) return 'II';
  return 'III';
}

// ─── Level Computation ───────────────────────────────────────────────────────
/**
 * computeLevel(totalXp) -- computes the full level data object for a given XP total.
 *
 * Returns:
 * {
 *   level,             // absolute level 1-100
 *   title,             // band title e.g. 'Freshman'
 *   subLevel,          // 'I', 'II', or 'III'
 *   displayTitle,      // e.g. 'Freshman I'
 *   xpIntoLevel,       // XP earned within current level
 *   xpToNextLevel,     // XP needed to reach next level
 *   xpForCurrentLevel, // total XP cost of current level
 *   progressPercent,   // 0-100 integer for progress bar
 * }
 */
export function computeLevel(totalXp) {
  const xp = Math.max(0, totalXp || 0);

  // Find the last band's total XP to detect max level
  const lastBandIdx = XP_BANDS.length - 1;
  const lastBand = XP_BANDS[lastBandIdx];
  const lastOffset = _BAND_OFFSETS[lastBandIdx];
  let lastBandTotal = 0;
  for (let p = 1; p <= lastBand.levels; p++) {
    lastBandTotal += Math.round(lastBand.cd * (p + lastOffset));
  }
  const maxXp = lastBand.baseXp + lastBandTotal;

  // If at or beyond max XP, return Legend III level 100 capped
  if (xp >= maxXp) {
    const xpForFinalLevel = Math.round(lastBand.cd * (10 + lastOffset));
    return {
      level: 100,
      title: 'Legend',
      subLevel: 'III',
      displayTitle: 'Legend III',
      xpIntoLevel: xpForFinalLevel,
      xpToNextLevel: 0,
      xpForCurrentLevel: xpForFinalLevel,
      progressPercent: 100,
    };
  }

  // Find which band the user is in (walk in reverse until totalXp >= band.baseXp)
  let bandIdx = 0;
  for (let i = XP_BANDS.length - 1; i >= 0; i--) {
    if (xp >= XP_BANDS[i].baseXp) {
      bandIdx = i;
      break;
    }
  }

  const band = XP_BANDS[bandIdx];
  const offset = _BAND_OFFSETS[bandIdx];
  const xpIntoBand = xp - band.baseXp;

  // Walk levels within the band
  // Level p costs: cd * (p + offset)
  let xpConsumed = 0;

  for (let p = 1; p <= band.levels; p++) {
    const levelCost = Math.round(band.cd * (p + offset));
    if (xpIntoBand < xpConsumed + levelCost) {
      const xpIntoLevel = xpIntoBand - xpConsumed;
      const xpForCurrentLevel = levelCost;
      const xpToNextLevel = levelCost - xpIntoLevel;
      const progressPercent = Math.round((xpIntoLevel / levelCost) * 100);
      const level = band.startLevel + p - 1;
      const subLevel = getSubLevel(p);

      return {
        level,
        title: band.title,
        subLevel,
        displayTitle: `${band.title} ${subLevel}`,
        xpIntoLevel,
        xpToNextLevel,
        xpForCurrentLevel,
        progressPercent,
      };
    }
    xpConsumed += levelCost;
  }

  // Fallback: user is at/past this band's computed max
  // (covered by band detection, but included for safety)
  const p = band.levels;
  const levelCost = Math.round(band.cd * (p + offset));
  const level = band.startLevel + p - 1;
  const subLevel = getSubLevel(p);
  return {
    level,
    title: band.title,
    subLevel,
    displayTitle: `${band.title} ${subLevel}`,
    xpIntoLevel: levelCost,
    xpToNextLevel: 0,
    xpForCurrentLevel: levelCost,
    progressPercent: 100,
  };
}

// ─── Module-level checkpoint ──────────────────────────────────────────────────
console.log('[XP Config] computeLevel loaded, bands:', XP_BANDS.length);
