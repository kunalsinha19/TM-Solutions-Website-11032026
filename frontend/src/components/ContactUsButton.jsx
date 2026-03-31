"use client";

import { useEffect, useState } from "react";

const initialForm = { name: "", email: "", message: "" };

export default function ContactUsButton({ variant = "header" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setStatus({ type: "idle", message: "" });
    }
  }, [open]);

  function handleChange(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    const emailValid = /.+@.+\..+/.test(form.email);
    if (!emailValid) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setStatus({ type: "loading", message: "Sending your message..." });

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStatus({ type: "success", message: "Thanks! We received your message and will respond soon." });
    } catch {
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    }
  }

  return (
    <>
      <button
        type="button"
        className={`contact-us-trigger ${variant === "panel" ? "contact-us-panel" : ""}`}
        onClick={() => setOpen(true)}
      >
        Contact Us
      </button>
      {open ? (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-modal-card">
            <button type="button" className="contact-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              ?
            </button>
            <div className="contact-modal-header">
              <p className="eyebrow">Contact us</p>
              <h3>Tell us how we can help</h3>
              <p className="muted">Share your requirements and our team will reach out shortly.</p>
            </div>
            <form className="contact-modal-form" onSubmit={handleSubmit}>
              <label>
                <span>Name</span>
                <input value={form.name} onChange={handleChange("name")} required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={handleChange("email")} required />
              </label>
              <label>
                <span>Message</span>
                <textarea rows="4" value={form.message} onChange={handleChange("message")} required />
              </label>
              <button type="submit" disabled={status.type === "loading"}>Send Message</button>
              {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}