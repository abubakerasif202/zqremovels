/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8A6E45',
        espresso: '#2A2015',
        ivory: '#FAF9F7'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Noto Serif', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: {
        soft: '6px'
      }
    }
  },
  plugins: []
};
