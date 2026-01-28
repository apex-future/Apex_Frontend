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
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      colors: {
        // Backgrounds (Light & Dark)
        'bg-primary': '#FAFAFA',
        'bg-elevated': '#FFFFFF',
        'bg-subtle': '#F3F4F6',
        'bg-dark-primary': '#0A0A0A',
        'bg-dark-elevated': '#171717',
        'bg-dark-subtle': '#262626',
        
        // Text (Light & Dark)
        'text-primary': '#0A0A0A',
        'text-secondary': '#404040',
        'text-tertiary': '#737373',
        'text-placeholder': '#A3A3A3',
        'text-dark-primary': '#FAFAFA',
        'text-dark-secondary': '#D4D4D4',
        'text-dark-tertiary': '#A3A3A3',
        
        // Borders (same for both modes)
        'border-default': '#E5E5E5',
        'border-subtle': '#F3F4F6',
        
        // Accent - Purple (same for both modes)
        'accent': {
          primary: '#8B5CF6',
          hover: '#A78BFA',
          pressed: '#7C3AED',
          subtle: '#F3E8FF',
        },
        
        // Semantic (same for both modes)
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}