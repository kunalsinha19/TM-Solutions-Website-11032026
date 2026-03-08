"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tara-maa-theme";

function applyTheme(nextTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", nextTheme === "dark");
}

function getPreferredTheme() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const label = useMemo(() => (theme === "dark" ? "Switch to light mode" : "Switch to dark mode"), [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const listener = (event) => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const systemTheme = event.matches ? "dark" : "light";
        setTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-siteBorder bg-white/80 px-4 py-2 text-sm font-medium text-slate-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/75 dark:text-white"
    >
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
      <span className="text-xs uppercase tracking-[0.2em]">{theme === "dark" ? "Sun" : "Moon"}</span>
    </button>
  );
}
