/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: 'var(--primary)',
        alert: {
          blue: 'var(--primary)',
          red: 'var(--red)',
          purple: 'var(--purple)',
          yellow: 'var(--yellow)',
          green: 'var(--green)',
          gray: 'var(--gray)',
        },
        'light-gray': 'var(--light-gray)',
        'black-primary': 'var(--black-1)',
        'black-secondary': 'var(--black-2)',
        gray: {
          1: 'var(--gray-1)',
          2: 'var(--gray-2)', // #727688
          3: 'var(--gray-3)',
          4: 'var(--gray-4)',
          5: 'var(--gray-5)',
          6: 'var(--gray-6)', // #424242
          7: 'var(--gray-7)',
        },
        black: {
          1: 'var(--black-1)',
        },
      },
      fontSize: {
        'h4-bold': [
          '28px',
          {
            lineHeight: '32px',
            fontWeight: '700',
          },
        ],
        'body-2-bold': [
          '16px',
          {
            lineHeight: '22px',
            fontWeight: '700',
          },
        ],
        'body-2-semibold': [
          '16px',
          {
            lineHeight: '22px',
            fontWeight: '600',
          },
        ],
        'body-2': [
          '16px',
          {
            lineHeight: '22px',
            fontWeight: '400',
          },
        ],
      },
    },
  },
  plugins: [],
};
