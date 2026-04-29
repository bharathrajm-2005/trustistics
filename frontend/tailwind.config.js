/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f9',
          100: '#fce7f5',
          200: '#fad0ec',
          300: '#f7a9da',
          400: '#f074bf',
          500: '#e34ba1',
          600: '#ab2b89', // Main solid color
          700: '#a82370',
          800: '#8b205d',
          900: '#751f50',
          950: '#480b2d',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      }
    },
  },
  plugins: [],
}
