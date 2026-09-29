/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chacara: {
          50: '#f2f8f4',
          100: '#e1efe5',
          200: '#c5e0cd',
          300: '#9ac9a8',
          400: '#69ab7d',
          500: '#488f5d',
          600: '#367248',
          700: '#2c5b3b',
          800: '#264831',
          900: '#203c2a',
        }
      }
    },
  },
  plugins: [],
}
