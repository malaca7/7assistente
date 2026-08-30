/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Elegant Emerald Accent (Softer, lower brightness)
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Softer Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          950: '#000000', // Pure Deep Black
          900: '#040404', // Deep Obsidian
          850: '#080808', // Low-Brightness Surface
          800: '#0e0e0e', // Dark Card
          750: '#141414', // Dark Hover
          700: '#1c1c1c', // Subtle Border
          600: '#282828',
          500: '#3d3d3d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 4px 20px -2px rgba(0, 0, 0, 0.8)',
        'glow-brand': '0 4px 20px -2px rgba(0, 0, 0, 0.8)',
        'glow-white': '0 4px 20px -2px rgba(0, 0, 0, 0.8)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'oled': '0 0 0 1px #141414, 0 8px 30px rgba(0, 0, 0, 0.98)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}
