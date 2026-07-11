import typography from '@tailwindcss/typography';

/**
 * ═══════════════════════════════════════════════════════════════
 *  APEX — AURA UI DESIGN SYSTEM
 *  Tailwind CSS v3 Configuration
 *
 *  Philosophy: Surface over stroke. Depth over decoration.
 *  No colored glows. No borders (except nav border-top).
 *  Elevation through shadow (black-based only) + surface color.
 *
 *  Last updated: Aura UI v1.0
 * ═══════════════════════════════════════════════════════════════
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: 'class',

  theme: {
    extend: {

      // ─────────────────────────────────────────────
      // TYPOGRAPHY
      // Primary (body/readable): Inter
      // Display (headers/UI labels): Space Grotesk
      // ─────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },

      // ─────────────────────────────────────────────
      // TRANSITION TIMING FUNCTIONS
      // Apple-grade easing curves — use these everywhere
      // instead of default ease-in-out
      // ─────────────────────────────────────────────
      transitionTimingFunction: {
        // Snappy entrance, smooth settle — use for entrances
        'apple': 'cubic-bezier(0.22, 1, 0.36, 1)',
        // Spring-like — use for gamification moments (XP gain, quest complete)
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Smooth and natural — use for exits and fades
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        // Sharp in, slow out — use for emphasis
        'emphasis': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        // Duration scale — use these, never arbitrary values
        'instant': '100ms',  // State changes (hover, active)
        'micro':   '200ms',  // Micro-interactions (button press)
        'base':    '300ms',  // Standard transitions
        'enter':   '350ms',  // Entrances
        'emphasis':'500ms',  // Gamification moments, emphasis
      },

      // ─────────────────────────────────────────────
      // ELEVATION — AURA SHADOW SYSTEM
      //
      // Rules:
      // - ALL shadows are black-based. Never colored.
      // - No glow. No colored box-shadow.
      // - sm  → cards, default surface elevation
      // - md  → raised elements, bottom sheets
      // - lg  → modals, overlays
      // - nav → nav bar only (top shadow, subtle)
      //
      // Old inner-thick shadows removed — not Aura.
      // ─────────────────────────────────────────────
      boxShadow: {
        // Aura elevation scale
        'aura-sm': '0 2px 8px rgba(0, 0, 0, 0.20)',
        'aura-md': '0 4px 16px rgba(0, 0, 0, 0.28)',
        'aura-lg': '0 8px 24px rgba(0, 0, 0, 0.35)',

        // Nav bar — border-top is the Aura rule,
        // but a subtle top shadow reinforces it
        'aura-nav': '0 -1px 0 rgba(255, 255, 255, 0.06)',

        // Glassmorphism shadow — used sparingly
        // with backdrop-blur elements only
        'aura-glass': '0 4px 24px rgba(0, 0, 0, 0.30)',
      },

      // ─────────────────────────────────────────────
      // COLOR SYSTEM
      //
      // All dynamic colors reference CSS variables
      // defined in aura-tokens.css (coming next).
      // Static semantic colors are defined here directly.
      //
      // Surface layers (dark mode, bottom to top):
      //   bg-base       → #0D0D0F  (deepest background)
      //   bg-surface    → #141416  (card background)
      //   bg-raised     → #1C1C1F  (elevated cards, dropdowns)
      //   bg-sunken     → #0A0A0C  (inputs, inactive areas)
      //
      // Surface layers (light mode, bottom to top):
      //   bg-base       → #F5F5F7
      //   bg-surface    → #FFFFFF
      //   bg-raised     → #FFFFFF  (with stronger shadow)
      //   bg-sunken     → #EBEBED
      // ─────────────────────────────────────────────
      colors: {

        // ── AURA SURFACES (CSS variable-driven) ──
        // These shift per mode via aura-tokens.css
        'surface': {
          base:    'rgb(var(--surface-base) / <alpha-value>)',
          DEFAULT: 'rgb(var(--surface-card) / <alpha-value>)',
          raised:  'rgb(var(--surface-raised) / <alpha-value>)',
          sunken:  'rgb(var(--surface-sunken) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
        },

        // ── LEGACY BG TOKENS (kept for backward compat) ──
        // Migrate components away from these over time
        'bg-primary':  'rgb(var(--surface-base) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--surface-raised) / <alpha-value>)',
        'bg-subtle':   'rgb(var(--surface-sunken) / <alpha-value>)',

        // ── HARDCODED DARK FALLBACKS (kept for compat) ──
        // Do not use in new components — use surface tokens
        'bg-dark-primary':  '#0D0D0F',
        'bg-dark-elevated': '#1C1C1F',
        'bg-dark-subtle':   '#141416',

        // ── TEXT ──
        'text-primary':     'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary':   'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary':    'rgb(var(--text-tertiary) / <alpha-value>)',
        'text-placeholder': 'rgb(var(--text-placeholder) / <alpha-value>)',

        // ── DARK TEXT FALLBACKS (kept for compat) ──
        'text-dark-primary':   '#FAFAFA',
        'text-dark-secondary': '#D4D4D4',
        'text-dark-tertiary':  '#A3A3A3',

        // ── BORDERS (kept, used only for nav border-top) ──
        'border-default': 'rgb(var(--border-default) / <alpha-value>)',
        'border-subtle':  'rgb(var(--border-subtle) / <alpha-value>)',

        // ── AURA BRAND — PURPLE GRADIENT FAMILY ──
        // Two-stop gradient only. Same hue, different depth.
        // Never mix with a different hue.
        'brand': {
          DEFAULT:  '#7C3AED', // violet-600 — energetic anchor
          deep:     '#3B0764', // violet-950 — shadow end
          mid:      '#5B21B6', // violet-800 — midpoint if needed
          light:    '#8B5CF6', // violet-500 — lighter accent
          lighter:  '#A78BFA', // violet-400 — hover state
          subtle:   'rgba(124, 58, 237, 0.12)', // surface tint, used sparingly
        },

        // ── ACCENT (legacy alias — maps to brand) ──
        'accent': {
          primary: '#8B5CF6',
          hover:   '#A78BFA',
          pressed: '#7C3AED',
          subtle:  'rgba(139, 92, 246, 0.12)',
        },

        // ── GAMIFICATION RANK COLORS ──
        // Each rank has one color. No glow — color only.
        'rank': {
          freshman:  '#94A3B8', // slate-400
          sophomore: '#60A5FA', // blue-400
          junior:    '#34D399', // emerald-400
          senior:    '#F59E0B', // amber-400
          scholar:   '#A855F7', // purple-500
          ace:       '#EC4899', // pink-500
          legend:    '#F97316', // orange-500
        },

        // ── SEMANTIC ──
        'success': '#10B981',
        'error':   '#EF4444',
        'warning': '#F59E0B',
        'info':    '#3B82F6',

        // ── GLASSMORPHISM (used sparingly in Aura) ──
        'card': {
          glass:        'rgba(var(--card-glass) / 0.6)',
          'glass-border': 'rgb(var(--card-glass-border) / <alpha-value>)',
          'glass-hover':  'rgb(var(--card-glass-hover) / <alpha-value>)',
        },

        // ── ICON BACKGROUNDS ──
        'icon': {
          900: '#0A0A0A',
          800: '#262626',
          700: '#404040',
          600: '#525252',
        },
      },

      // ─────────────────────────────────────────────
      // BACKGROUND GRADIENTS
      // Two-stop, same purple hue family only.
      // Direction conventions:
      //   135deg → cards (diagonal, dynamic)
      //   180deg → full backgrounds (atmospheric)
      //    90deg → horizontal bars (XP bar, progress)
      // ─────────────────────────────────────────────
      backgroundImage: {
        // Primary brand gradient
        'brand-gradient':    'linear-gradient(135deg, #7C3AED 0%, #3B0764 100%)',
        'brand-gradient-v':  'linear-gradient(180deg, #7C3AED 0%, #3B0764 100%)',
        'brand-gradient-h':  'linear-gradient(90deg,  #7C3AED 0%, #3B0764 100%)',

        // Subtle surface tint — for card backgrounds, not buttons
        'brand-tint':        'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,7,100,0.08) 100%)',

        // XP bar fill
        'xp-bar':            'linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)',

        // Dark mode ambient background (very subtle)
        'dark-ambient':      'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(76,29,149,0.25) 0%, transparent 60%)',
      },

      // ─────────────────────────────────────────────
      // ANIMATIONS
      // Frozen: pulse-purple (audit before removing)
      // ─────────────────────────────────────────────
      animation: {
        'blink':        'blink 1s step-end infinite',
        'slide-up':     'slideUp 0.3s ease-out',
        'pulse-purple': 'pulse-purple 0.6s ease-in-out infinite', // ⚠️ audit before removing
        'bounce-slow':  'bounce 3s infinite',

        // Aura additions
        'fade-in':      'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-up-sm':  'slideUpSm 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'xp-fill':      'xpFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },

      keyframes: {
        // ── Existing (kept) ──
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'pulse-purple': {
          '0%, 100%': { backgroundColor: '#8B5CF6', color: 'white' },
          '50%':      { backgroundColor: 'rgba(255, 255, 255, 0.4)', color: 'inherit' },
        },
        slideUp: {
          '0%':   { transform: 'translateX(-50%) translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateX(-50%) translateY(0)',    opacity: '1' },
        },

        // ── Aura additions ──
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpSm: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        xpFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--xp-width)' }, // set via inline style
        },
      },

      // ─────────────────────────────────────────────
      // SPACING — unchanged, already correct
      // ─────────────────────────────────────────────
      spacing: {
        'px':   '1px',
        '0':    '0',
        '0.5':  '2px',
        '1':    '4px',
        '1.5':  '6px',
        '2':    '8px',
        '2.5':  '10px',
        '3':    '12px',
        '4':    '16px',
        '5':    '20px',
        '6':    '24px',
        '7':    '28px',
        '8':    '32px',
        '9':    '36px',
        '10':   '40px',
        '11':   '44px',
        '12':   '48px',
        '14':   '56px',
        '16':   '64px',
        '20':   '80px',
        '24':   '96px',
        '28':   '112px',
        '32':   '128px',
        '36':   '144px',
        '40':   '160px',
        '44':   '176px',
        '48':   '192px',
        '52':   '208px',
        '56':   '224px',
        '60':   '240px',
        '64':   '256px',
        '72':   '288px',
        '80':   '320px',
        '96':   '384px',
      },

      // ─────────────────────────────────────────────
      // BORDER RADIUS — unchanged, already correct
      // ─────────────────────────────────────────────
      borderRadius: {
        'none':    '0',
        'sm':      '4px',
        'DEFAULT': '8px',
        'md':      '12px',
        'lg':      '16px',
        'xl':      '24px',
        '2xl':     '32px',
        '3xl':     '48px',
        'card':    '2rem',
        'full':    '9999px',
      },

      // ─────────────────────────────────────────────
      // LETTER SPACING — unchanged
      // ─────────────────────────────────────────────
      letterSpacing: {
        'tightest': '-0.02em',
        'tighter':  '-0.01em',
        'tight':    '-0.005em',
        'normal':   '0',
        'wide':     '0.01em',
        'wider':    '0.025em',
        'widest':   '0.05em',
      },

      // ─────────────────────────────────────────────
      // LINE HEIGHT — unchanged
      // ─────────────────────────────────────────────
      lineHeight: {
        'premium-tight':   '1.1',
        'premium-snug':    '1.3',
        'premium-normal':  '1.5',
        'premium-relaxed': '1.7',
        'tight':           '1.2',
        'snug':            '1.375',
        'normal':          '1.5',
        'relaxed':         '1.625',
        'loose':           '2',
        'none':            '1',
        '3':  '12px',
        '4':  '16px',
        '5':  '20px',
        '6':  '24px',
        '7':  '28px',
        '8':  '32px',
        '9':  '36px',
        '10': '40px',
      },

      // ─────────────────────────────────────────────
      // SCREENS — unchanged
      // ─────────────────────────────────────────────
      screens: {
        'xs': '425px',
      },

    },
  },

  plugins: [
    typography,
    require('tailwindcss-animate'),
  ],
}
