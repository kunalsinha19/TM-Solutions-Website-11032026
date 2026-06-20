import type { Config } from "tailwindcss";
import preset from "../../packages/shared-config/tailwind-preset";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  presets: [preset],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"]
      },
      backgroundImage: {
        grain: "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 50%), linear-gradient(135deg, rgba(180,83,9,0.14), rgba(8,47,73,0.12))",
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180,83,9,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(217,119,6,0.12) 0%, transparent 60%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)"
      },
      boxShadow: {
        soft: "0 20px 40px rgba(12, 17, 29, 0.08)",
        card: "0 4px 24px rgba(12, 17, 29, 0.06), 0 1px 3px rgba(12, 17, 29, 0.04)",
        "card-hover": "0 20px 60px rgba(12, 17, 29, 0.12), 0 4px 16px rgba(12, 17, 29, 0.06)",
        glow: "0 0 40px rgba(180, 83, 9, 0.25)",
        "glow-sm": "0 0 20px rgba(180, 83, 9, 0.15)"
      },
      animation: {
        "float-slow": "float-slow 8s ease-in-out infinite",
        "float-medium": "float-medium 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "fade-up": "count-up 0.6s ease-out forwards"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      }
    }
  },
  plugins: []
};

export default config;
