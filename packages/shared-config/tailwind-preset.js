module.exports = {
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        panel: "var(--color-panel)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        "accent-light": "var(--color-accent-light)",
        warm: "var(--color-warm)",
        gold: "var(--color-gold)"
      },
      boxShadow: {
        soft: "0 20px 40px rgba(12, 17, 29, 0.08)",
        card: "0 4px 24px rgba(12, 17, 29, 0.06), 0 1px 3px rgba(12, 17, 29, 0.04)",
        "card-hover": "0 20px 60px rgba(12, 17, 29, 0.12), 0 4px 16px rgba(12, 17, 29, 0.06)",
        glow: "0 0 40px rgba(180, 83, 9, 0.25)",
        "glow-sm": "0 0 20px rgba(180, 83, 9, 0.15)"
      }
    }
  }
};
