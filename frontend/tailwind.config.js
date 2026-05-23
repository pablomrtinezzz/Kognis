/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090E",
        foreground: "#F2F4F8",
        primary: "#2577FF",
        accent: "#10B981",
        card: "#111118",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "primary-glow": "0 8px 32px -4px rgba(37,119,255,0.45)",
        "accent-glow": "0 8px 32px -4px rgba(16,185,129,0.35)",
        card: "0 2px 16px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset",
        float:
          "0 20px 60px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04) inset",
      },
    },
  },
  plugins: [],
};
