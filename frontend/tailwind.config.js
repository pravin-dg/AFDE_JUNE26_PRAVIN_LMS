/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FEFDF8', 100: '#FDF8F0', 200: '#FAF0DC', 300: '#F5E6C8' },
        brown: { 100: '#FAECD8', 200: '#F0CFA0', 300: '#E6B168', 400: '#C8934A', 500: '#A67C52', 600: '#8B6340', 700: '#6B4C2F', 800: '#4A3520', 900: '#2D1F0F' },
        navy: { 500: '#3730A3', 600: '#2E27A0', 700: '#1E1B8A', 800: '#1E1B4B', 900: '#0F0E2E' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31, 38, 135, 0.1)',
        'card-hover': '0 20px 40px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
