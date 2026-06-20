"use client";

import { useEffect, useState } from "react";
import type { ThemeMode } from "../lib/theme";

const STORAGE_KEY = "tara-maa-theme";

export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>("light");

  // Read persisted theme once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "green" || stored === "light") {
        setModeState(stored);
      }
    } catch {}
  }, []);

  // Apply theme to <html> whenever mode changes
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  function setMode(next: ThemeMode) {
    setModeState(next);
  }

  return { mode, setMode };
}
