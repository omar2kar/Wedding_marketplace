/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f5ef',
          100: '#f4e9dc', // champagne white
          200: '#edd6c3',
          300: '#e4cbaa',
          400: '#dcb692',
          500: '#e8c597', // warm golden beige (main)
          600: '#c7a48a', // neutral beige accent
          700: '#a9866e',
          800: '#8c6d58',
          900: '#705544',
        },
        secondary: {
          50: '#f4f6fa',
          100: '#e9eef7',
          200: '#d6dff0',
          300: '#c3d0e9',
          400: '#a9b8de',
          500: '#7e99c4', // calm blue (footer/background)
          600: '#6d87b0',
          700: '#5c769d',
          800: '#4b6488',
          900: '#3b526f',
        },
        accentTop: '#ecc0a4',   // light apricot/pink (top background)
        accentNeutral: '#c7a48a', // neutral warm beige (borders/accents)




      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
