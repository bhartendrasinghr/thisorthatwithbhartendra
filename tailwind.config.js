/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#1a1f6b', dark: '#0f1238' },
        gold: '#d4a93a',
        ink: { DEFAULT: '#0f1238', 2: '#4a4d70', 3: '#8a8da8' },
        paper: { DEFAULT: '#ffffff', 2: '#f7f7fb', 3: '#eef0f7' },
        rule: { DEFAULT: '#e5e7f0', 2: '#eef0f7' },
        bg: '#ece6d4',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
