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
        // Pitoco de Gente Brand Colors (Deep Dark & Neutral - Sem tons azuis)
        pitoco: {
          blue: {
            DEFAULT: '#f4f4f5', // Substituído azul por branco/zinco neutro
            light: '#ffffff',
            lighter: '#ffffff',
            dark: '#18181b',
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
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        primary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#f4f4f5',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        pinkBrand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
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
          500: '#10b981',
          600: '#059669',
        },
        dark: {
          950: '#000000', // Preto absoluto (sem azul)
          900: '#09090b', // Preto carvão profundo
          850: '#111113', // Superfície escura
          800: '#18181b', // Cartão escuro zinc
          750: '#202024', // Hover escuro
          700: '#27272a', // Borda sutil
          600: '#3f3f46',
          500: '#71717a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 4px 20px -2px rgba(255, 255, 255, 0.08)',
        'glow-pink': '0 4px 20px -2px rgba(244, 114, 182, 0.3)',
        'glow-mint': '0 4px 20px -2px rgba(16, 185, 129, 0.3)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.06)',
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
