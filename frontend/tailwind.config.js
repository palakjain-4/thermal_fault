/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fairy: {
          blush: '#FFDBDB',
          pastel: '#FDC3D1',
          baby: '#FDA8BF',
          bubblegum: '#FB8CAC',
          white: '#FFFFFF',
          deep: '#5E1D2D',
          wine: '#44101D',
          muted: '#8F3F56',
          soft: '#FFEAEF',
          canvas: '#FFF7F9',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'fairy': '0 12px 35px -8px rgba(251, 140, 172, 0.22)',
        'fairy-sm': '0 4px 16px -2px rgba(251, 140, 172, 0.14)',
        'fairy-lg': '0 24px 50px -12px rgba(251, 140, 172, 0.30)',
        'fairy-hover': '0 16px 36px -6px rgba(251, 140, 172, 0.35)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      }
    },
  },
  plugins: [],
}
