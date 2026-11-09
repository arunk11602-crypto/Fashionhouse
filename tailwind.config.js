/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Devanagari', 'sans-serif'],
      },
      colors: {
        maroon: {
          50: '#FBF2F3',
          100: '#F3DDE0',
          200: '#E4B9C0',
          300: '#CF8C98',
          400: '#AE5565',
          500: '#8E2F40',
          600: '#731F2F',
          700: '#5B0F1E',
          800: '#4A0C19',
          900: '#2E0710',
        },
        cream: {
          50: '#FFFDF8',
          100: '#FBF5E9',
          200: '#F5EBD3',
          300: '#EBDAB0',
        },
        gold: {
          300: '#E6CB8A',
          400: '#D9B56A',
          500: '#C9A24B',
          600: '#A9832F',
          700: '#86662A',
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(46, 7, 16, 0.25)',
        'card-hover': '0 24px 48px -16px rgba(46, 7, 16, 0.35)',
      },
    },
  },
  plugins: [],
};
