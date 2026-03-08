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

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

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
  const widgetIdRef = useRef(null);
  const captchaContainerRef = useRef(null);

  useEffect(() => {
    let active = true;

    if (!siteKey || !captchaContainerRef.current) {
      setStatus({ type: "error", message: "reCAPTCHA site key is not configured." });
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
            setForm((current) => ({ ...current, captchaToken: "" }));
            setStatus({ type: "error", message: "reCAPTCHA failed to load correctly." });
          }
        });
        setCaptchaReady(true);
      })
      .catch(() => {
        if (active) {
          setStatus({ type: "error", message: "Unable to load reCAPTCHA." });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.captchaToken) {
      setStatus({ type: "error", message: "Please complete reCAPTCHA verification." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting quote request..." });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit quote request");
      }

      setForm(initialForm);
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setStatus({ type: "success", message: "Your quote request has been submitted." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setForm((current) => ({ ...current, captchaToken: "" }));
    }
  }

  return (
    <section id="quote" className="section-block quote-section">
      <div className="container quote-grid">
        <div>
          <p className="eyebrow">Quote form</p>
          <h2>Tell us what you need and we will route it to the right team.</h2>
          <p className="section-description">
            This section is designed for qualified B2B lead capture, with a clean experience on both desktop and mobile.
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
          <label><span>Requirement</span><textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label>
          <div className="captcha-box">
            <div ref={captchaContainerRef} />
            <p className="captcha-note">{captchaReady ? "Verification required before submission." : "Loading reCAPTCHA..."}</p>
          </div>
          <button type="submit">Send quote request</button>
          {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
        </form>
      </div>
    </section>
  );
}
