"use client";

import { useEffect } from "react";

export default function TranslateWidget() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mount = document.getElementById("google_translate_element");
    if (!mount) {
      return;
    }

    if (mount.childElementCount > 0) {
      return;
    }

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          includedLanguages: "en,hi,zh-CN,ja",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        "google_translate_element"
      );
    };

    const existingScript = document.getElementById("google-translate-script");
    if (existingScript) {
      if (window.google?.translate?.TranslateElement) {
        window.googleTranslateElementInit();
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="translate-toggle" aria-label="Translate">
      <span className="translate-label">Translate</span>
      <div id="google_translate_element" />
    </div>
  );
}
