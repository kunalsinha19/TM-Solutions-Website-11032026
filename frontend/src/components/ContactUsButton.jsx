"use client";

import { useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const CONTACT_PHONE = "+91 92297 98710";
const STORAGE_KEY = "tms-contact-visits";

export default function ContactUsButton() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [form, setForm] = useState({ name: "", address: "", contact: "" });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    const current = Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
    const next = current + 1;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    setVisitCount(next);
  }, []);

  useEffect(() => {
    if (!open) {
      setStatus({ type: "idle", message: "" });
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.address.trim() || !form.contact.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    setStatus({ type: "loading", message: "Saving your details..." });

    try {
      const response = await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          contact: form.contact.trim(),
          visitCount,
          source: "brand-mode"
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to save contact request.");
      }

      setSubmitted(true);
      setStatus({ type: "success", message: "Details saved. You can now contact us directly." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  function handleChange(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <>
      <button type="button" className="contact-us-button" onClick={() => setOpen(true)}>
        Contact Us
      </button>
      {open ? (
        <div className="contact-modal">
          <div className="contact-modal-card">
            <div className="contact-modal-header">
              <div>
                <p className="eyebrow">Contact us</p>
                <h3>Share your details to unlock the direct number</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
            {!submitted ? (
              <form className="contact-modal-form" onSubmit={handleSubmit}>
                <label>
                  <span>Name</span>
                  <input value={form.name} onChange={handleChange("name")} required />
                </label>
                <label>
                  <span>Address</span>
                  <input value={form.address} onChange={handleChange("address")} required />
                </label>
                <label>
                  <span>Contact number</span>
                  <input value={form.contact} onChange={handleChange("contact")} required />
                </label>
                <button type="submit">Proceed</button>
                {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
              </form>
            ) : (
              <div className="contact-modal-success">
                <p className="muted">Thank you for sharing your details.</p>
                <h4>Call us now: {CONTACT_PHONE}</h4>
                <p className="muted">We respond quickly during business hours.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
