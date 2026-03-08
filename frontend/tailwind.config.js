/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Barlow Condensed', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#020617',
        },
        lime: {
          accent: '#D9F99D',
        },
        brand: {
          bg: '#020617',
          surface: '#0F172A',
          'surface-hi': '#1E293B',
          primary: '#D9F99D',
          'primary-fg': '#0F172A',
          secondary: '#3B82F6',
          accent: '#22D3EE',
          danger: '#EF4444',
          success: '#22C55E',
          text: '#F8FAFC',
          muted: '#94A3B8',
          border: 'rgba(148, 163, 184, 0.1)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};
