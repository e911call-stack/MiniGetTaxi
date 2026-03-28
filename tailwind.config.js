/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jordan-yellow': '#FFD700',
        'jordan-yellow-dark': '#E6C200',
        'jordan-black': '#1A1A1A',
        'jordan-gray': '#333333',
      },
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'sans-serif'],
        'english': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
