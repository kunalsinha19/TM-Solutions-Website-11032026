"use client";

import { useEffect, useState } from "react";

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

export function TranslateWidget() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

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

    const checkActive = () => {
      setActive(
        document.body.classList.contains("translated-ltr") ||
        document.body.classList.contains("translated-rtl")
      );
    };
    checkActive();
    const observer = new MutationObserver(checkActive);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="gt-wrapper" title="Translate page">
      {/* Visible themed icon button — pointer-events disabled so select overlay handles clicks */}
      <div
        className={`gt-icon-btn${active ? " gt-icon-btn--active" : ""}`}
        aria-hidden="true"
      >
        <LanguagesIcon />
        {active && <span className="gt-active-dot" />}
      </div>

      {/* Google injects a <select> here; we make it a transparent, full-cover overlay
          so clicking anywhere on the wrapper opens the native language picker */}
      <div
        id="google_translate_element"
        className={
          ready ? "gt-select-overlay" : "gt-select-overlay gt-select-overlay--hidden"
        }
      />
    </div>
  );
}

function LanguagesIcon() {
  return (
    <svg
      width="16"
      height="16"
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
