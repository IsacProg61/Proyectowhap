/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0b141a",
          sidebar: "#111b21",
          panel: "#2a3942",
          border: "#222e35",
          text: "#e9edef",
          muted: "#8696a0",
          accent: "#00a884",
        },
      },
    },
  },
  plugins: [],
}