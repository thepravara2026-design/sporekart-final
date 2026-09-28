/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#173B2A',
          800: '#1F4D35',
          700: '#2F6B45',
        },
        green: {
          600: '#3F7D4D',
          500: '#5A9360',
        },
        moss: '#607D52',
        leaf: '#7FA66A',
        sage: '#B8C9A8',
        soil: '#5C4635',
        gold: {
          DEFAULT: '#C79A4A',
          soft: '#E6C98D',
        },
        surface: {
          cream: '#F6F2E8',
          white: '#FFFFFF',
          offwhite: '#FCFCF8',
          neutral: '#F3F4ED',
          border: '#E1E5DA',
        },
        typography: {
          primary: '#172019',
          secondary: '#59645B',
          muted: '#7C857D',
        },
        // Legacy mapping aliases to prevent broken class names while standardizing
        spore: {
          50: '#F6F2E8',
          100: '#F3F4ED',
          200: '#E1E5DA',
          300: '#B8C9A8',
          400: '#7FA66A',
          500: '#5A9360',
          600: '#3F7D4D',
          700: '#2F6B45',
          800: '#1F4D35',
          900: '#173B2A',
          950: '#0F261B',
        },
        earth: {
          50: '#FCFCF8',
          100: '#F6F2E8',
          200: '#E1E5DA',
          300: '#E6C98D',
          400: '#C79A4A',
          500: '#5C4635',
          600: '#4D3A2B',
          700: '#3D2E22',
          800: '#2E2219',
          900: '#1F1711',
          950: '#120D0A',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif']
      },
      boxShadow: {
        'level-1': '0 4px 16px rgba(23, 59, 42, 0.06)',
        'level-2': '0 10px 28px rgba(23, 59, 42, 0.10)',
        'level-3': '0 18px 50px rgba(23, 59, 42, 0.14)',
        // Legacy aliases mapped to level-1/2/3
        'surface': '0 4px 16px rgba(23, 59, 42, 0.06)',
        'card': '0 4px 16px rgba(23, 59, 42, 0.06)',
        'card-hover': '0 10px 28px rgba(23, 59, 42, 0.10)',
        'floating': '0 18px 50px rgba(23, 59, 42, 0.14)',
        'glow': '0 0 24px -4px rgba(63, 125, 77, 0.25)',
      },
      borderRadius: {
        'micro': '4px',
        'compact': '8px',
        'input': '12px',
        'card': '16px',
        'feature': '20px',
        'container': '24px',
        'hero': '32px',
        'pill': '9999px',
        // Legacy aliases
        'small': '8px',
        'medium': '12px',
        'large': '16px',
        'xlarge': '20px',
      }
    },
  },
  plugins: [],
}
