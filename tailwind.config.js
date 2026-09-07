/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pitoco de Gente Brand Colors
        pitoco: {
          blue: {
            DEFAULT: '#38BDF8', // Azul Bebê
            light: '#BAE6FD',
            lighter: '#E0F2FE',
            dark: '#0284C7',
          },
          pink: {
            DEFAULT: '#F472B6', // Rosa Bebê / Seco
            light: '#FBCFE8',
            lighter: '#FDF2F8',
            dark: '#DB2777',
          },
          mint: {
            DEFAULT: '#10B981', // Verde Menta
            light: '#A7F3D0',
            lighter: '#ECFDF5',
            dark: '#059669',
          },
          cream: '#FFFBEB',
          lavender: '#EDE9FE',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8', // Azul Bebê Primário
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#38bdf8', // Pitoco Baby Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        pinkBrand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6', // Pitoco Pink
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        mintBrand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Pitoco Mint
          600: '#059669',
        },
        dark: {
          950: '#030712', // Obsidian Slate
          900: '#0b1329', // Deep Midnight Blue
          850: '#0f172a', // Navy Dark
          800: '#1e293b', // Dark Card
          750: '#283548', // Dark Hover
          700: '#334155', // Subtle Border
          600: '#475569',
          500: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 4px 20px -2px rgba(56, 189, 248, 0.4)',
        'glow-pink': '0 4px 20px -2px rgba(244, 114, 182, 0.4)',
        'glow-mint': '0 4px 20px -2px rgba(16, 185, 129, 0.4)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
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
