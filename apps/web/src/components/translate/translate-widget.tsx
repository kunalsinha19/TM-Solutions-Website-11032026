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

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
      setReady(true);
    };

    // Only inject once across hot-reloads
    if (!document.getElementById("gt-script")) {
      const script = document.createElement("script");
      script.id = "gt-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Script already loaded — widget may already exist
      setReady(true);
    }
  }, []);

  return (
    <div className="translate-wrapper flex items-center gap-1.5">
      {/* Globe icon label — always visible regardless of select state */}
      <span
        className="pointer-events-none select-none text-base leading-none text-muted"
        aria-hidden="true"
      >
        🌐
      </span>

      {/* Hidden until Google injects the select; opacity lets the select appear naturally */}
      <div
        id="google_translate_element"
        className={ready ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
        style={{ transition: "opacity 0.2s" }}
      />

      {/* Fallback label shown before Google loads */}
      {!ready && (
        <span className="text-[11px] text-muted">Translate</span>
      )}
    </div>
  );
}
