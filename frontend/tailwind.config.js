/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0f0e17", // Deep purple/black background
          sidebar: "#16161e", // Slightly lighter sidebar
          panel: "#1a1a24",  // Panel color
          border: "#292938", // Soft purple-tinged border
          text: "#fffffe", // Crisp white text
          muted: "#a7a9be", // Muted text
          accent: "#7f5af0", // Vibrant Electric Purple accent
          accent_hover: "#6b46c1", // Darker purple for hover states
        },
        "whatsapp-green": "#7f5af0", // Alias old green class names to our new purple so we don't break old components instantly
      },
    },
  },
  plugins: [],
}