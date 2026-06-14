/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ifmg: {
          green: '#2e8b57', // Verde IFMG
          red: '#c8102e',   // Vermelho IFMG
          light: '#f8fafc', // Fundo claro para interfaces
        }
      }
    },
  },
  plugins: [],
}
