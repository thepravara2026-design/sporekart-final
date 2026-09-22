/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spore: {
          50: '#f4f8f4',
          100: '#e3eee3',
          200: '#c6dec7',
          300: '#9ec49f',
          400: '#71a373',
          500: '#4e8551',
          600: '#3c6a3f',
          700: '#325434',
          800: '#2a432c',
          900: '#1a2e1c',
          950: '#0b160c',
        },
        earth: {
          50: '#fbf8f5',
          100: '#f5efe8',
          200: '#eadcd0',
          300: '#d9c2b0',
          400: '#c4a28c',
          500: '#b48870',
          600: '#a3745d',
          700: '#885e4b',
          800: '#704d3e',
          900: '#5c4135',
          950: '#31211b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        'surface': '0 2px 8px -1px rgba(0, 0, 0, 0.25), 0 1px 4px -1px rgba(0, 0, 0, 0.15)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.35), 0 2px 8px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 12px 32px -4px rgba(78, 133, 81, 0.25), 0 4px 16px -2px rgba(0, 0, 0, 0.4)',
        'floating': '0 16px 40px -8px rgba(0, 0, 0, 0.5), 0 6px 20px -4px rgba(78, 133, 81, 0.15)',
        'glow': '0 0 24px -4px rgba(52, 211, 153, 0.35)',
      },
      borderRadius: {
        'small': '0.375rem',
        'medium': '0.5rem',
        'large': '0.75rem',
        'xlarge': '1rem',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}

