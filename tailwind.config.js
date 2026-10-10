/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          yellow: '#FFF8E1',
          green: '#E8F5E9',
          pink: '#FCE4EC',
          blue: '#E1F5FE',
          white: '#F5F5F7',
        },
      },
    },
  },
  plugins: [],
}
