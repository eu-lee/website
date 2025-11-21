export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#071013',
          panel: '#0b1220',
          text: '#c7f9d2',
          muted: '#7f9aa6',
          accent: '#22c55e',
          dark: '#071329',
          prompt: '#22c55e',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
