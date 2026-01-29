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
        // Direct color mappings for utility classes (bg-background, text-foreground, etc.)
        background: '#ffffff',
        foreground: '#1a1a1a',
        surface: '#f9fafb',
        border: '#d1d5db',
        muted: '#6b7280',
        primary: '#5865f2',
        success: '#23a55a',
        warning: '#f0b232',
        danger: '#f23f43',

        // Discord-inspired dark theme (nested - use with bg-background-primary, etc.)
        'background-primary': '#1e1f22',
        'background-secondary': '#2b2d31',
        'background-tertiary': '#313338',
        'background-modifier-hover': 'rgba(79, 84, 92, 0.16)',
        'background-modifier-active': 'rgba(79, 84, 92, 0.24)',
        'background-modifier-selected': 'rgba(79, 84, 92, 0.32)',

        text: {
          primary: '#1a1a1a',
          secondary: '#374151',
          muted: '#6b7280',
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
          background: '#ffffff',
          border: '#d1d5db',
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
