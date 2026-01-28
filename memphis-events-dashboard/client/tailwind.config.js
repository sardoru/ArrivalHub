/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        demand: {
          low: '#22c55e',
          moderate: '#eab308',
          high: '#f97316',
          'very-high': '#ef4444',
          extreme: '#dc2626'
        }
      }
    },
  },
  plugins: [],
}
