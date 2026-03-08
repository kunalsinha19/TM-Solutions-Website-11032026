/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        siteBg: "var(--bg)",
        siteText: "var(--text)",
        siteAccent: "var(--accent)",
        siteBorder: "var(--border)"
      }
    }
  },
  plugins: []
};
