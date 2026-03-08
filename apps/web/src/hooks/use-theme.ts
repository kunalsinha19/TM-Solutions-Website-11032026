"use client";

import { useEffect, useState } from "react";
import type { ThemeMode } from "../lib/theme";

const STORAGE_KEY = "tara-maa-theme";

export function useThemeMode(defaultMode: ThemeMode = "system") {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored) {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;

    root.dataset.theme = resolved;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return { mode, setMode };
}
