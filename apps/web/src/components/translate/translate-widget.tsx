"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          config: Record<string, unknown>,
          elementId: string
        ) => unknown;
      };
    };
  }
}

const LANGUAGES = [
  { code: "en",    label: "English",   name: "English" },
  { code: "hi",    label: "हिंदी",     name: "Hindi" },
  { code: "bn",    label: "বাংলা",     name: "Bengali" },
  { code: "te",    label: "తెలుగు",    name: "Telugu" },
  { code: "ta",    label: "தமிழ்",     name: "Tamil" },
  { code: "gu",    label: "ગુજરાતી",  name: "Gujarati" },
  { code: "mr",    label: "मराठी",     name: "Marathi" },
  { code: "pa",    label: "ਪੰਜਾਬੀ",   name: "Punjabi" },
  { code: "kn",    label: "ಕನ್ನಡ",    name: "Kannada" },
  { code: "ml",    label: "മലയാളം",   name: "Malayalam" },
  { code: "or",    label: "ଓଡ଼ିଆ",    name: "Odia" },
  { code: "ur",    label: "اردو",      name: "Urdu" },
  { code: "ar",    label: "العربية",   name: "Arabic" },
  { code: "fr",    label: "Français",  name: "French" },
  { code: "es",    label: "Español",   name: "Spanish" },
  { code: "de",    label: "Deutsch",   name: "German" },
  { code: "zh-CN", label: "中文",      name: "Chinese" },
  { code: "ja",    label: "日本語",    name: "Japanese" },
];

function triggerGTSelect(code: string) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;
  select.value = code;
  select.dispatchEvent(new Event("change"));
  return true;
}

export function TranslateWidget() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
      setReady(true);
    };

    if (!document.getElementById("gt-script")) {
      const script = document.createElement("script");
      script.id = "gt-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      setReady(true);
    }

    const syncLang = () => {
      if (
        document.body.classList.contains("translated-ltr") ||
        document.body.classList.contains("translated-rtl")
      ) {
        const m = document.cookie.match(/googtrans=\/en\/([^;]+)/);
        setActiveLang(m ? decodeURIComponent(m[1]) : "?");
      } else {
        setActiveLang(null);
      }
    };
    syncLang();
    const obs = new MutationObserver(syncLang);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const pickLanguage = (code: string) => {
    setOpen(false);
    if (code === "en") {
      triggerGTSelect("en");
    } else {
      triggerGTSelect(code);
    }
  };

  const reset = () => {
    setOpen(false);
    triggerGTSelect("en");
  };

  const isTranslated = activeLang !== null && activeLang !== "en";
  const activeInfo = LANGUAGES.find((l) => l.code === activeLang);

  return (
    <div ref={wrapperRef} className="gt-root">
      {/* GT engine lives off-screen — still in DOM so Google can initialize */}
      <div id="google_translate_element" className="gt-engine-anchor" />

      {/* Trigger button */}
      <button
        type="button"
        className={`gt-trigger${isTranslated ? " gt-trigger--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={isTranslated ? `Translated to ${activeInfo?.name ?? activeLang}` : "Translate page"}
      >
        <LanguagesIcon />
        {isTranslated && (
          <span className="gt-badge">{activeInfo?.label?.slice(0, 2) ?? "A"}</span>
        )}
      </button>

      {/* Language picker popover */}
      {open && (
        <div className="gt-popover" role="listbox" aria-label="Select language">
          <div className="gt-popover-head">
            <span className="gt-popover-title">
              <LanguagesIcon /> Translate
            </span>
            {isTranslated && (
              <button type="button" className="gt-reset" onClick={reset}>
                Reset to English
              </button>
            )}
          </div>

          <div className="gt-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={lang.code === "en" ? !isTranslated : activeLang === lang.code}
                className={`gt-lang${(lang.code === "en" ? !isTranslated : activeLang === lang.code) ? " gt-lang--active" : ""}`}
                onClick={() => pickLanguage(lang.code)}
              >
                <span className="gt-lang-native">{lang.label}</span>
                <span className="gt-lang-name">{lang.name}</span>
              </button>
            ))}
          </div>

          {!ready && (
            <p className="gt-loading">Loading translator…</p>
          )}
        </div>
      )}
    </div>
  );
}

function LanguagesIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8l6 6" />
      <path d="M4 14l6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}
