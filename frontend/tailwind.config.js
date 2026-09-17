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
          900: '#233825',
          950: '#111f12',
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
      }
    },
  },
  plugins: [],
}
