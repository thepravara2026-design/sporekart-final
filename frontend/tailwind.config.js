/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forestgreen: {
          50: '#f2f8f4',
          100: '#e2f2e6',
          200: '#c5e5ce',
          300: '#9bd1aa',
          400: '#64b37a',
          500: '#16532f',
          600: '#124426',
          700: '#0e361e',
          800: '#0a2716',
          900: '#06190e',
        },
        brandgreen: {
          50: '#f2f8f4',
          100: '#e2f2e6',
          200: '#c5e5ce',
          300: '#9bd1aa',
          400: '#64b37a',
          500: '#16532f',
          600: '#124426',
          700: '#0e361e',
          800: '#0a2716',
          900: '#06190e',
        },
        spore: {
          50: '#f2f8f4',
          100: '#e2f2e6',
          200: '#c5e5ce',
          300: '#9bd1aa',
          400: '#64b37a',
          500: '#16532f',
          600: '#124426',
          700: '#0e361e',
          800: '#0a2716',
          900: '#06190e',
          950: '#f2f8f4',
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

