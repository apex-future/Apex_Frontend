import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Default body font
        display: ['Space Grotesk', 'Inter', 'sans-serif'], // Headlines
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-purple': 'pulse-purple 0.6s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      screens: {
        'xs': '425px',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-purple': {
          '0%, 100%': { backgroundColor: '#8B5CF6', color: 'white' },
          '50%': { backgroundColor: 'rgba(255, 255, 255, 0.4)', color: 'inherit' },
        },
        slideUp: {
          '0%': { transform: 'translateX(-50%) translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'inner-thick': 'inset 0 0 20px 10px rgba(0, 0, 0, 0.2)',
        'inner-thick-white': 'inset 0 0 20px 10px rgba(0, 0, 0, 0.2), 0 0 10px 2px rgba(255, 255, 255, 0.5)',
      },
      letterSpacing: {
        'tightest': '-0.02em',
        'tighter': '-0.01em',
        'tight': '-0.005em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.025em',
        'widest': '0.05em',
      },
      lineHeight: {
        'premium-tight': '1.1',
        'premium-snug': '1.3',
        'premium-normal': '1.5',
        'premium-relaxed': '1.7',
        'tight': '1.2',    // 24px for 20px font
        'snug': '1.375',  // 22px for 16px font
        'normal': '1.5',  // 24px for 16px font
        'relaxed': '1.625', // 26px for 16px font
        'loose': '2',      // 32px for 16px font
        'none': '1',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
      },
      spacing: {
        'px': '1px',
        '0': '0',
        '0.5': '2px', // 2pt
        '1': '4px',   // 4pt
        '1.5': '6px', // 6pt
        '2': '8px',   // 8pt (Standard)
        '2.5': '10px',
        '3': '12px',
        '4': '16px',  // 16pt (Standard)
        '5': '20px',
        '6': '24px',  // 24pt (Standard)
        '7': '28px',
        '8': '32px',  // 32pt (Standard)
        '9': '36px',
        '10': '40px', // 40pt (Standard)
        '11': '44px',
        '12': '48px', // 48pt (Standard)
        '14': '56px',
        '16': '64px', // 64pt (Standard)
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        'full': '9999px',
      },
      colors: {
        // Backgrounds
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',

        // Keep explicit dark backgrounds for backward compatibility if hardcoded somewhere, 
        // though not strictly needed anymore.
        'bg-dark-primary': '#121212',
        'bg-dark-elevated': '#1c1c1e',
        'bg-dark-subtle': '#262628',

        // Text
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
        'text-placeholder': 'rgb(var(--text-placeholder) / <alpha-value>)',

        // Dark text fallback
        'text-dark-primary': '#FAFAFA',
        'text-dark-secondary': '#D4D4D4',
        'text-dark-tertiary': '#A3A3A3',

        // Borders
        'border-default': 'rgb(var(--border-default) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',

        // Accent - Purple (same for both modes)
        'accent': {
          primary: '#8B5CF6',
          hover: '#A78BFA',
          pressed: '#7C3AED',
          subtle: 'rgba(139, 92, 246, 0.15)', // Changed to use rgba for better dark mode visibility
        },

        // Semantic (same for both modes)
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',

        // Card Backgrounds - Glassmorphic Neutrals
        'card': {
          glass: 'rgba(var(--card-glass) / 0.6)', // Use with backdrop-blur
          'glass-border': 'rgb(var(--card-glass-border) / <alpha-value>)',
          'glass-hover': 'rgb(var(--card-glass-hover) / <alpha-value>)',
        },

        // Icon Backgrounds - Monochrome Gradient
        'icon': {
          900: '#0A0A0A',
          800: '#262626',
          700: '#404040',
          600: '#525252',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    typography,
  ],
}
