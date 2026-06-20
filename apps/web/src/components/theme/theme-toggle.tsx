"use client";

import { useThemeMode } from "../../hooks/use-theme";
import type { ThemeMode } from "../../lib/theme";

const ORDER: ThemeMode[] = ["light", "dark", "green"];

const NEXT_LABEL: Record<ThemeMode, string> = {
  light: "Dark",
  dark: "Green",
  green: "Light",
};

const NEXT_ICON: Record<ThemeMode, string> = {
  light: "🌙",
  dark: "🌿",
  green: "☀️",
};

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();
  const idx = ORDER.indexOf(mode);
  const next = ORDER[(idx + 1) % ORDER.length];

  return (
    <button
      type="button"
      title={`Switch to ${NEXT_LABEL[mode]} mode`}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted hover:border-accent/40 hover:text-text transition-colors"
      onClick={() => setMode(next)}
    >
      <span>{NEXT_ICON[mode]}</span>
      {NEXT_LABEL[mode]}
    </button>
  );
}
