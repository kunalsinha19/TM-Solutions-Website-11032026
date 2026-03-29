"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tara-maa-theme";

function applyTheme(nextTheme) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.classList.toggle("brand", nextTheme === "brand");
}

function getPreferredTheme() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "brand") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-icon-svg">
      <circle cx="12" cy="12" r="4.25" fill="currentColor" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-icon-svg">
      <path d="M19.2 14.8A7.9 7.9 0 0 1 9.2 4.8a8.7 8.7 0 1 0 10 10Z" fill="currentColor" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-icon-svg">
      <path d="M12 2l2.2 4.9 5.3.5-4 3.6 1.2 5.2-4.7-2.7-4.7 2.7 1.2-5.2-4-3.6 5.3-.5L12 2z" fill="currentColor" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const label = useMemo(() => {
    if (theme === "dark") return "Switch to brand mode";
    if (theme === "brand") return "Switch to light mode";
    return "Switch to dark mode";
  }, [theme]);

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
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "brand" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  const buttonText = theme === "dark" ? "Brand mode" : theme === "brand" ? "Light mode" : "Dark mode";
  const icon = theme === "dark" ? <BrandIcon /> : theme === "brand" ? <SunIcon /> : <MoonIcon />;

  return (
    <button type="button" aria-label={label} onClick={toggleTheme} className="theme-toggle">
      <span className="theme-toggle-icon" aria-hidden="true">{icon}</span>
      <span className="theme-toggle-text">{buttonText}</span>
    </button>
  );
}
