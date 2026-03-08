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
        grain:
          "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 50%), linear-gradient(135deg, rgba(180,83,9,0.14), rgba(8,47,73,0.12))"
      }
    }
  },
  plugins: []
};

export default config;
