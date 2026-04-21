const path = require('node:path');

const contentPaths = [
  path.join(__dirname, 'index.html').replace(/\\/g, '/'),
  path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: contentPaths,
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F6EF',
          100: '#C9E8DA',
          200: '#A3D6BB',
          300: '#6EC293',
          400: '#3BAA6F',
          500: '#2E7D32',
          600: '#27692C',
          700: '#1F5424',
          800: '#193F1E',
          900: '#133418',
        },
        earth: {
          50: '#F4ECE7',
          100: '#E8D7CD',
          200: '#D0B4A9',
          300: '#B28C7F',
          400: '#8C6B52',
          500: '#6D4C41',
          600: '#5A3C33',
          700: '#46302A',
          800: '#33241F',
          900: '#251A17',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
};
