/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cork: {
          light: '#deb887',
          DEFAULT: '#bd8c61',
          dark: '#96633d',
        },
        note: {
          yellow: '#fff9c4',
          blue: '#bbdefb',
          pink: '#f8bbd0',
          green: '#c8e6c9',
        }
      },
      boxShadow: {
        'note': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'note-bottom': '0 8px 6px -6px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'cork': "url('./corkimage.jpg')",
      },
      backgroundColor: {
        'cork-overlay': 'rgba(139, 69, 19, 0.1)',
      }
    },
  },
  plugins: [],
} 