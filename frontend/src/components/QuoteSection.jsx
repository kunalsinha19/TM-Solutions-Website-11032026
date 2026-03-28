"use client";

import { useEffect, useRef, useState } from "react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  captchaToken: ""
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
const hasRealSiteKey = siteKey && !siteKey.startsWith("your-");

function loadRecaptchaScript() {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }

    const existing = document.querySelector('script[data-recaptcha="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.grecaptcha));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = "true";
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function QuoteSection() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaMode, setCaptchaMode] = useState(hasRealSiteKey ? "live" : "bypass");
  const widgetIdRef = useRef(null);
  const captchaContainerRef = useRef(null);

  useEffect(() => {
    let active = true;

    if (!hasRealSiteKey || !captchaContainerRef.current) {
      setCaptchaMode("bypass");
      setCaptchaReady(true);
      setForm((current) => ({ ...current, captchaToken: "dev-bypass" }));
      return undefined;
    }

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (!active || !grecaptcha || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = grecaptcha.render(captchaContainerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setForm((current) => ({ ...current, captchaToken: token }));
            setStatus((current) => (current.type === "error" ? { type: "idle", message: "" } : current));
          },
          "expired-callback": () => {
            setForm((current) => ({ ...current, captchaToken: "" }));
          },
          "error-callback": () => {
            setCaptchaMode("bypass");
            setCaptchaReady(true);
            setForm((current) => ({ ...current, captchaToken: "dev-bypass" }));
            setStatus({ type: "idle", message: "" });
          }
        });
        setCaptchaReady(true);
      })
      .catch(() => {
        if (active) {
          setCaptchaMode("bypass");
          setCaptchaReady(true);
          setForm((current) => ({ ...current, captchaToken: "dev-bypass" }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.captchaToken) {
      setStatus({ type: "error", message: "Please complete verification before sending the form." });
      return;
    }

    setStatus({ type: "loading", message: "Sending your request..." });

    try {
      const response = await fetch(`${apiBase}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),`n        signal: controller.signal`n      });`n      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit quote request");
      }

      setForm(initialForm);
      if (window.grecaptcha && widgetIdRef.current !== null && captchaMode === "live") {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      if (captchaMode === "bypass") {
        setForm((current) => ({ ...current, captchaToken: "dev-bypass" }));
      }
      setStatus({ type: "success", message: "Thank you. Your request has been sent successfully." });
    } catch (error) {`n      const message = error.name === "AbortError" ? "Request timed out. Please try again." : error.message;`n      setStatus({ type: "error", message });
      if (window.grecaptcha && widgetIdRef.current !== null && captchaMode === "live") {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setForm((current) => ({ ...current, captchaToken: captchaMode === "bypass" ? "dev-bypass" : "" }));
    }
  }

  return (
    <section id="quote" className="section-block quote-section">
      <div className="container quote-grid">
        <div>
          <p className="eyebrow">Get a quote</p>
          <h2>Tell us what you need and we will get back to you.</h2>
          <p className="section-description">
            Fill in the form with your product need, quantity, or project detail. Our team will review it and contact you with the next steps.
          </p>
        </div>
        <form className="quote-form" onSubmit={handleSubmit}>
          <div className="grid-two">
            <label><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          </div>
          <div className="grid-two">
            <label><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label><span>Company</span><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          </div>
          <label><span>Your requirement</span><textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label>
          <div className="captcha-box">
            {captchaMode === "live" ? <div ref={captchaContainerRef} /> : null}
            <p className="captcha-note">
              {captchaReady
                ? captchaMode === "live"
                  ? "Verification is ready. Please confirm before sending the form."
                  : "Verification is running in local bypass mode, so you can send the request directly."
                : "Loading verification..."}
            </p>
          </div>
          <button type="submit">Send Request</button>
          {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
        </form>
      </div>
    </section>
  );
}



