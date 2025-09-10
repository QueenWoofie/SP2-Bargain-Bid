/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        base: {
          100: '#effcf9',
          200: '#cafaf0',
          300: '#96f7e4',
          A: '#effcf9',
        },
        primary: { DEFAULT: '#00d3bb', A: '#00d3bb' },
        secondary: { DEFAULT: '#f861b4', A: '#f861b4' },
        accent: { DEFAULT: '#c079ff', A: '#3c0366' },
        neutral: { DEFAULT: '#009689', A: '#009689' },
        info: { DEFAULT: '#4ea0ff', A: '#274886' },
        success: { DEFAULT: '#01df72', A: '#01df72' },
        warning: { DEFAULT: '#ff8904', A: '#421104' },
        error: { DEFAULT: '#ff627d', A: '#ff627d' },
      },
    },
  },
  plugins: [],
};
