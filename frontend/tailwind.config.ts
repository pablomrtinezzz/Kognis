import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Single glob — catches all components including src/components/ui/*
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable references in RGB channel format so Tailwind can
        // inject opacity modifiers: bg-primary/10 → rgb(37 119 255 / 0.1)
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
      },
      backdropBlur: {
        xs: "2px",
        "4xl": "72px",
      },
      boxShadow: {
        "primary-glow": "0 8px 32px -4px rgba(37,119,255,0.45)",
        "accent-glow": "0 8px 32px -4px rgba(16,185,129,0.35)",
        card: "0 2px 16px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset",
        float:
          "0 20px 60px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04) inset",
        // Glass panels need THREE layers: outer ring, depth shadow, inner highlight
        glass:
          "0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset",
        "glass-hover":
          "0 0 0 1px rgba(255,255,255,0.10) inset, 0 12px 48px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.07) inset",
        "primary-panel":
          "0 0 0 1px rgba(37,119,255,0.18) inset, 0 8px 40px rgba(37,119,255,0.10), 0 20px 60px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
