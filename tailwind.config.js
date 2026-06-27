/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand - The Bridge metaphor: Blue (education) → Teal (practice)
        brand: {
          50: '#E8F4F8',
          100: '#D0E9F1',
          200: '#A1D3E3',
          300: '#72BDD5',
          400: '#43A7C7',
          500: '#1A5FA8',   // Primary - Trust, clinical authority
          600: '#148A9A',   // Secondary - Growth, transition
          700: '#0D6B7A',
          800: '#094C56',
          900: '#052D33',
        },
        // Semantic
        success: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32',   // Cleared, approved, on-track
          600: '#1B5E20',
        },
        warning: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#F57F17',   // Pending, expiring soon
          600: '#E65100',
        },
        danger: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#C62828',   // Deficit, rejected, urgent
          600: '#B71C1C',
        },
        // Neutral - Warm clinical
        surface: {
          0: '#FFFFFF',
          50: '#FAFAF8',    // Card backgrounds
          100: '#F5F4F0',   // Page background
          200: '#EBE9E4',   // Borders, dividers
          300: '#D9D6CF',   // Input borders
          400: '#C8C4BB',
          500: '#9A978E',   // Muted text
          600: '#6B6860',
          700: '#5C5A54',   // Secondary text
          800: '#3D3B36',
          900: '#1C1B18',   // Primary text
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs': ['11px', { lineHeight: '16px' }],
        'sm': ['12px', { lineHeight: '18px' }],
        'base': ['13px', { lineHeight: '20px' }],
        'lg': ['14px', { lineHeight: '22px' }],
        'xl': ['15px', { lineHeight: '24px' }],
        '2xl': ['18px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '10px',
        'lg': '14px',
        'xl': '18px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04)',
        'DEFAULT': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        'lg': '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
        'bridge': '0 2px 8px rgba(26,95,168,0.12), 0 1px 3px rgba(26,95,168,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionTimingFunction: {
        'bridge': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
