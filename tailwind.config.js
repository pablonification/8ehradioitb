/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-plus-jakarta-sans)"],
        body: ["var(--font-arimo)"],
        accent: ["var(--font-instrument-serif)"],
        "plus-jakarta-sans": ["var(--font-plus-jakarta-sans)"],
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
      },
    },
  },
  plugins: [],
};
