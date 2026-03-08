"use client";

import { useThemeMode } from "../../hooks/use-theme";

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <button
      type="button"
      className="rounded-full border border-border px-3 py-2 text-xs font-medium"
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
    >
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
