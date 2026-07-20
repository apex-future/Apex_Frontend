/**
 * questConfig.js — Quest system constants for Apex gamification.
 * Daily quest pool, tier pools, reward pool, and helper utilities.
 */

// ─── Progressive Reading Steps ────────────────────────────────────────────────
export const PROGRESSIVE_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90];

// ─── Quest Subcategories ──────────────────────────────────────────────────────
export const QUEST_SUBCATEGORIES = {
  reading: [
    {
      id: 'read_10_pages',
      copy: 'Read 10 pages in one sitting',
      action: 'pages_read',
      target: 10,
      unit: 'pages',
      tier: 'free',
      subcategory: 'reading',
    },
    /* {
      id: 'open_before_9am',
      copy: 'Open a book before 9am',
      action: 'open_before_hour',
      target: 9,
      unit: '',
      tier: 'free',
      subcategory: 'reading',
    }, */
    {
      id: 'read_2_books',
      copy: 'Read across 2 different books today',
      action: 'books_opened',
      target: 2,
      unit: 'books',
      tier: 'free',
      subcategory: 'reading',
    },
    /* {
      id: 'read_before_noon',
      copy: 'Complete a reading session before noon',
      action: 'session_before_noon',
      target: 1,
      unit: '',
      tier: 'free',
      subcategory: 'reading',
    }, */
    /* {
      id: 'unbroken_30',
      copy: 'Read for 30 minutes without switching apps',
      action: 'unbroken_session',
      target: 30,
      unit: 'min',
      tier: 'free',
      subcategory: 'reading',
    }, */
  ],

  annotation: [
    {
      id: 'highlight_5',
      copy: 'Highlight 5 passages today',
      action: 'highlight_created',
      target: 5,
      unit: 'highlights',
      tier: 'free',
      subcategory: 'annotation',
    },
    {
      id: 'note_3_highlights',
      copy: 'Add a note to 3 highlights',
      action: 'note_added',
      target: 3,
      unit: 'notes',
      tier: 'free',
      subcategory: 'annotation',
    },
    {
      id: 'highlight_10_session',
      copy: 'Create 10 highlights in one reading session',
      action: 'highlight_created',
      target: 10,
      unit: 'highlights',
      tier: 'free',
      subcategory: 'annotation',
    },
    {
      id: 'highlight_2_books',
      copy: 'Highlight passages in 2 different books',
      action: 'highlight_in_books',
      target: 2,
      unit: 'books',
      tier: 'free',
      subcategory: 'annotation',
    },
  ],

  dictionary: [
    {
      id: 'lookup_3',
      copy: 'Look up 3 words in the dictionary today',
      action: 'dictionary_lookup',
      target: 3,
      unit: 'words',
      tier: 'free',
      subcategory: 'dictionary',
    },
    {
      id: 'lookup_5_session',
      copy: 'Look up 5 words in a single reading session',
      action: 'dictionary_lookup',
      target: 5,
      unit: 'words',
      tier: 'free',
      subcategory: 'dictionary',
    },

  ],

  ai_engagement: [
    {
      id: 'ask_cleo_3',
      copy: 'Ask Cleo 3 questions today',
      action: 'ai_explanation',
      target: 3,
      unit: 'questions',
      tier: 'free',
      subcategory: 'ai_engagement',
    },
    {
      id: 'ask_cleo_session',
      copy: 'Ask Cleo 5 questions in one session',
      action: 'ai_explanation',
      target: 5,
      unit: 'questions',
      tier: 'free',
      subcategory: 'ai_engagement',
    },

  ],

  /* consistency: [
    {
      id: 'open_before_8am',
      copy: 'Open Apex before 8am',
      action: 'open_before_hour',
      target: 8,
      unit: '',
      tier: 'free',
      subcategory: 'consistency',
    },
    {
      id: 'complete_by_6pm',
      copy: 'Complete all 3 daily quests by 6pm',
      action: 'all_complete_before_hour',
      target: 18,
      unit: '',
      tier: 'free',
      subcategory: 'consistency',
    },
    {
      id: 'study_after_9pm',
      copy: 'Log a reading session after 9pm',
      action: 'session_after_hour',
      target: 21,
      unit: '',
      tier: 'free',
      subcategory: 'consistency',
    },
  ], */

  flashcard: [
    {
      id: 'practice_5_decks',
      copy: 'Practice at least 5 flashcard decks today',
      action: 'flashcard_practiced',
      target: 5,
      unit: 'decks',
      tier: 'free',
      subcategory: 'flashcard',
    },
    {
      id: 'generate_deck',
      copy: 'Generate a fresh deck of flashcards',
      action: 'flashcard_generated',
      target: 1,
      unit: '',
      tier: 'free',
      subcategory: 'flashcard',
    },
    {
      id: 'practice_3_decks',
      copy: 'Practice 3 flashcard decks today',
      action: 'flashcard_practiced',
      target: 3,
      unit: 'decks',
      tier: 'free',
      subcategory: 'flashcard',
    },
  ],

  recall: [
    {
      id: 'complete_1_quiz',
      copy: 'Complete 1 quiz from any book',
      action: 'quiz_completed',
      target: 1,
      unit: '',
      tier: 'scholar',
      subcategory: 'recall',
    },
    {
      id: 'score_70',
      copy: 'Score 70% or higher on any quiz',
      action: 'quiz_score',
      target: 70,
      unit: '%',
      tier: 'scholar',
      subcategory: 'recall',
    },
    {
      id: 'complete_2_quizzes',
      copy: 'Complete 2 quizzes today',
      action: 'quiz_completed',
      target: 2,
      unit: '',
      tier: 'scholar',
      subcategory: 'recall',
    },

  ],

  book_space: [
    {
      id: 'log_in_space',
      copy: 'Log a reading session in your Book Space',
      action: 'book_space_session',
      target: 1,
      unit: '',
      tier: 'scholar',
      subcategory: 'book_space',
    },
    /* {
      id: 'check_space_stats',
      copy: 'Check your Book Space stats today',
      action: 'book_space_viewed',
      target: 1,
      unit: '',
      tier: 'scholar',
      subcategory: 'book_space',
    }, */
    /* {
      id: 'set_space_goal',
      copy: 'Set or review a study goal in your Book Space',
      action: 'book_space_goal',
      target: 1,
      unit: '',
      tier: 'scholar',
      subcategory: 'book_space',
    }, */
  ],

  simplify: [
    {
      id: 'simplify_3',
      copy: 'Simplify 3 passages today',
      action: 'simplify',
      target: 3,
      unit: 'passages',
      tier: 'scholar',
      subcategory: 'simplify',
    },
    {
      id: 'simplify_once',
      copy: 'Use Simplify at least once today',
      action: 'simplify',
      target: 1,
      unit: '',
      tier: 'scholar',
      subcategory: 'simplify',
    },
  ],

  /* reflection: [
    {
      id: 'check_analytics',
      copy: 'Check your reading analytics for any book',
      action: 'analytics_viewed',
      target: 1,
      unit: '',
      tier: 'achiever',
      subcategory: 'reflection',
    },
    {
      id: 'review_quiz_history',
      copy: 'Review your quiz history today',
      action: 'quiz_history_viewed',
      target: 1,
      unit: '',
      tier: 'achiever',
      subcategory: 'reflection',
    },
    {
      id: 'check_weekly_time',
      copy: 'Check how many hours you have read this week',
      action: 'weekly_stats_viewed',
      target: 1,
      unit: '',
      tier: 'achiever',
      subcategory: 'reflection',
    },
  ], */

  // TODO: wire when share features ship
  /* share: [], */
};

// ─── Tier Pools ───────────────────────────────────────────────────────────────
const FREE_SUBCATEGORIES = ['reading', 'annotation', 'dictionary', 'ai_engagement', 'flashcard'];
const SCHOLAR_SUBCATEGORIES = [...FREE_SUBCATEGORIES, 'recall', 'book_space', 'simplify'];
const ACHIEVER_SUBCATEGORIES = [...SCHOLAR_SUBCATEGORIES]; // no new subcategory until reflection is properly designed
const APEX_SUBCATEGORIES = [...ACHIEVER_SUBCATEGORIES];

export const TIER_POOLS = {
  free: FREE_SUBCATEGORIES,
  scholar: SCHOLAR_SUBCATEGORIES,
  achiever: ACHIEVER_SUBCATEGORIES,
  apex: APEX_SUBCATEGORIES,
};

// ─── Reward Pool ──────────────────────────────────────────────────────────────
export const REWARD_POOL = [
  { type: 'refresh_tokens', amount: 3, label: '3 Refresh Tokens' },
  { type: 'highlight_colours', duration_hours: 24, label: 'All highlight colours for 24hrs' },
  { type: 'xp_boost', amount: 500, label: '+500 XP' },
  { type: 'ai_questions', amount: 5, label: '+5 AI questions today' },
  { type: 'refresh_tokens', amount: 2, label: '2 Refresh Tokens' },
  { type: 'xp_boost', amount: 300, label: '+300 XP' },
  { type: 'quiz_generation', duration_hours: 24, label: 'Quiz generation for 24hrs' },
  { type: 'xp_boost', amount: 800, label: '+800 XP' },
  { type: 'ai_questions', amount: 8, label: '+8 AI questions today' },
  { type: 'analytics_tab', duration_hours: 24, label: 'Analytics tab for 24hrs' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * getQuestPoolForTier(tier)
 * Returns all quest templates available for that tier (flat array).
 * Does NOT include the progressive reading anchor — that is assigned separately.
 */
export function getQuestPoolForTier(tier) {
  const subcategoryKeys = TIER_POOLS[tier] || TIER_POOLS.free;
  return subcategoryKeys.flatMap((key) => QUEST_SUBCATEGORIES[key] || []);
}

/**
 * getRandomReward()
 * Draws one reward randomly from REWARD_POOL.
 */
export function getRandomReward() {
  const idx = Math.floor(Math.random() * REWARD_POOL.length);
  return REWARD_POOL[idx];
}

// ─── Module-level checkpoint ──────────────────────────────────────────────────
console.log(
  '[Quest Config] loaded, pool sizes:',
  getQuestPoolForTier('free').length,
  getQuestPoolForTier('scholar').length,
  getQuestPoolForTier('achiever').length
);
