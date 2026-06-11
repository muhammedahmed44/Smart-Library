/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Lora"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        parchment: {
          50:  '#fdfaf4',
          100: '#f7f0df',
          200: '#efe0bc',
          300: '#e3c98f',
          400: '#d4ab61',
          500: '#c89040',
          600: '#b07535',
          700: '#8e5a2c',
          800: '#704726',
          900: '#5c3b22',
        },
        ink: {
          50:  '#f4f4f5',
          100: '#e4e4e7',
          200: '#c4c4ca',
          300: '#9494a0',
          400: '#64647a',
          500: '#3d3d55',
          600: '#2d2d42',
          700: '#1e1e30',
          800: '#13131f',
          900: '#0a0a12',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};