/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        cream: {
          50: '#FAFAED',
          100: '#F5F5DC',
          200: '#E8E5CE',
          300: '#D4D0B8',
          400: '#B5B09A',
          500: '#96917C',
          600: '#78735F',
          700: '#5A5648',
          800: '#3C3930',
          900: '#1C1A17',
        },
      },
    },
  },
  plugins: [],
}
