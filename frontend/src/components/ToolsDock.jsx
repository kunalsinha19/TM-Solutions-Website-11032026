"use client";

import { useEffect, useState } from "react";
import TranslateWidget from "./TranslateWidget";
import ThemeToggle from "./ThemeToggle";
import ContactUsButton from "./ContactUsButton";

export default function ToolsDock() {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) {
    return (
      <>
        <ContactUsButton />
        <TranslateWidget />
        <ThemeToggle />
      </>
    );
  }

  return (
    <div className="tools-menu">
      <button type="button" className="tools-burger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <div className="tools-panel">
          <TranslateWidget />
          <ThemeToggle />
        </div>
      ) : null}
    </div>
  );
}
