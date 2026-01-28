/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Discord-inspired dark theme
        background: {
          primary: '#1e1f22',
          secondary: '#2b2d31',
          tertiary: '#313338',
          modifier: {
            hover: 'rgba(79, 84, 92, 0.16)',
            active: 'rgba(79, 84, 92, 0.24)',
            selected: 'rgba(79, 84, 92, 0.32)',
          },
        },
        text: {
          primary: '#f2f3f5',
          secondary: '#b5bac1',
          muted: '#949ba4',
          link: '#00a8fc',
        },
        brand: {
          primary: '#5865f2',
          hover: '#4752c4',
        },
        status: {
          success: '#23a55a',
          warning: '#f0b232',
          danger: '#f23f43',
          info: '#00a8fc',
        },
        input: {
          background: '#1e1f22',
          border: '#3f4147',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'elevation-low': '0 1px 0 rgba(4, 4, 5, 0.2), 0 1.5px 0 rgba(6, 6, 7, 0.05), 0 2px 0 rgba(4, 4, 5, 0.05)',
        'elevation-medium': '0 4px 4px rgba(0, 0, 0, 0.16)',
        'elevation-high': '0 8px 16px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
};
