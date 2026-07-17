"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  isQuoteSuccess?: boolean;
}

const STORAGE_KEY = "tms-chat-history";
const MAX_HISTORY = 20;

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(msgs: Message[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY))); } catch {}
}

// Detect script → TTS language tag
function detectLang(text: string): string {
  if (/[ऀ-ॿ]/.test(text)) return "hi-IN";   // Devanagari (Hindi/Marathi)
  if (/[஀-௿]/.test(text)) return "ta-IN";   // Tamil
  if (/[ఀ-౿]/.test(text)) return "te-IN";   // Telugu
  if (/[ঀ-৿]/.test(text)) return "bn-IN";   // Bengali
  if (/[઀-૿]/.test(text)) return "gu-IN";   // Gujarati
  if (/[਀-੿]/.test(text)) return "pa-IN";   // Punjabi
  if (/[ಀ-೿]/.test(text)) return "kn-IN";   // Kannada
  if (/[ഀ-ൿ]/.test(text)) return "ml-IN";   // Malayalam
  return "en-IN";
}

// Parse SUBMIT_QUOTE:{...} token from bot response
function extractQuote(text: string): { clean: string; quote: Record<string, string> | null } {
  const idx = text.indexOf("SUBMIT_QUOTE:");
  if (idx === -1) return { clean: text, quote: null };

  const after = text.slice(idx + "SUBMIT_QUOTE:".length).trim();
  let depth = 0; let end = -1;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === "{") depth++;
    else if (after[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return { clean: text.slice(0, idx).trim(), quote: null };

  try {
    const quote = JSON.parse(after.slice(0, end + 1));
    return { clean: text.slice(0, idx).trim(), quote };
  } catch {
    return { clean: text.slice(0, idx).trim(), quote: null };
  }
}

interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  ((e: Event) => void) | null;
  onend:    (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export default function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [voiceOn, setVoiceOn]     = useState(false);
  const [listening, setListening] = useState(false);
  const [hasSR, setHasSR]         = useState(false);
  const [hasTTS, setHasTTS]       = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const recognRef    = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    setMessages(loadHistory());
    setHasSR(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
    setHasTTS("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/SUBMIT_QUOTE:[^}]*\}/g, "").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = detectLang(clean);
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  // ── Voice input ───────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.lang = "hi-IN"; // Works for Hinglish too; browser's ML handles mixed
    r.continuous = false;
    r.interimResults = false;

    r.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      recognRef.current = null;
    };
    r.onerror = () => { setListening(false); recognRef.current = null; };
    r.onend   = () => { setListening(false); recognRef.current = null; };

    r.start();
    recognRef.current = r;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognRef.current?.stop();
    setListening(false);
  }, []);

  // ── Quote submission ──────────────────────────────────────────────────────────
  const submitQuote = useCallback(async (quote: Record<string, string>, transcript: Message[]): Promise<boolean> => {
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quote,
          captchaToken: "demo-captcha-token",
          source: "chat",
          chatTranscript: transcript.slice(-20).map(m => ({ role: m.role, text: m.text.slice(0, 500) })),
        }),
      });
      return res.ok;
    } catch { return false; }
  }, []);

  // ── Core send ────────────────────────────────────────────────────────────────
  const sendText = useCallback(async (msg: string) => {
    if (!msg.trim() || streaming) return;

    const userMsg: Message = { role: "user", text: msg };
    const placeholder: Message = { role: "bot", text: "…" };

    setMessages(prev => {
      const next = [...prev, userMsg, placeholder];
      saveHistory(next);
      return next;
    });
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const histSnap = messages.slice(-MAX_HISTORY).map(m => ({
        role: m.role === "user" ? "user" : "bot",
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: histSnap }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let fullText  = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { text } = JSON.parse(payload);
            if (!text) continue;
            fullText += text;

            if (firstChunk) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: fullText };
                return next;
              });
              firstChunk = false;
            } else {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: fullText };
                return next;
              });
            }
          } catch { /* skip malformed */ }
        }
      }

      // Post-stream: handle SUBMIT_QUOTE token
      const { clean, quote } = extractQuote(fullText);

      if (quote) {
        // Show clean text (without the token)
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: clean };
          return next;
        });
        speak(clean);

        // Submit the quote (include transcript for admin chat history)
        const ok = await submitQuote(quote, messages);
        const confirmMsg: Message = ok
          ? {
              role: "bot",
              text: `✅ Quote submitted successfully! We'll contact you at ${quote.email || quote.phone} within 24 hours. Is there anything else I can help you with?`,
              isQuoteSuccess: true,
            }
          : { role: "bot", text: "⚠️ Quote submission failed. Please try the form at /quote or email us at taramaasolutions2025@gmail.com." };

        setMessages(prev => {
          const next = [...prev, confirmMsg];
          saveHistory(next);
          return next;
        });
        speak(confirmMsg.text);
      } else {
        // Normal message — show final text, speak it
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: fullText };
          saveHistory(next);
          return next;
        });
        speak(fullText);
      }

      if (!open) setUnread(u => u + 1);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      const errMsg = "Sorry, something went wrong. Please try again or email taramaasolutions2025@gmail.com.";
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: errMsg };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }, [streaming, messages, open, speak, submitQuote]);

  const send = useCallback(() => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    sendText(msg);
  }, [input, sendText]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([]); sessionStorage.removeItem(STORAGE_KEY);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open TMS chat assistant"}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg,var(--color-accent) 0%,var(--color-warm) 100%)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px color-mix(in srgb,var(--color-accent) 45%,transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {unread > 0 && !open && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "var(--color-warm)", color: "white", fontSize: "11px", fontWeight: 700,
            borderRadius: "10px", minWidth: "18px", height: "18px",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
          }}>{unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "92px", right: "24px", zIndex: 9998,
          width: "min(390px,calc(100vw - 32px))",
          height: "min(560px,calc(100dvh - 120px))",
          background: "var(--color-panel)",
          border: "1px solid var(--color-border)", borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,var(--color-accent) 0%,var(--color-warm) 100%)",
            padding: "12px 14px",
            display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>TMS Assist</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: "11px" }}>
                <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", marginRight: "4px", verticalAlign: "middle" }}/>
                Online · Hindi · English · Regional
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {/* TTS toggle */}
              {hasTTS && (
                <button
                  onClick={() => {
                    setVoiceOn(v => !v);
                    if (voiceOn) window.speechSynthesis?.cancel();
                  }}
                  title={voiceOn ? "Mute voice" : "Enable voice replies"}
                  style={{
                    background: voiceOn ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.12)",
                    border: "none", borderRadius: "6px", color: "white",
                    cursor: "pointer", padding: "4px 7px", fontSize: "16px", lineHeight: 1,
                  }}
                >{voiceOn ? "🔊" : "🔇"}</button>
              )}
              {messages.length > 0 && (
                <button onClick={clearChat} title="Clear chat" style={{
                  background: "rgba(255,255,255,.15)", border: "none", borderRadius: "6px",
                  color: "white", cursor: "pointer", padding: "4px 8px", fontSize: "11px",
                }}>Clear</button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 12px", color: "var(--color-muted)" }}>
                <div style={{ fontSize: "30px", marginBottom: "8px" }}>🏭</div>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "var(--color-text)" }}>
                  Welcome to TM Solutions
                </div>
                <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                  Ask me anything in <strong>English, Hindi, Hinglish</strong> or any regional language.<br/>
                  I can show products, take your requirements, and submit a quote for you!
                </div>
                <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {[
                    "What products do you offer?",
                    "Mujhe ek quote chahiye",
                    "Tell me about your pumps",
                    "How to contact sales?",
                  ].map(q => (
                    <button key={q} onClick={() => sendText(q)} style={{
                      background: "var(--color-accent-light)", border: "1px solid var(--color-gold)",
                      borderRadius: "20px", padding: "5px 10px",
                      fontSize: "11px", cursor: "pointer", color: "var(--color-warm)",
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.isQuoteSuccess ? (
                  <div style={{
                    maxWidth: "90%", padding: "12px 14px",
                    background: "linear-gradient(135deg,#d1fae5,#ecfdf5)",
                    border: "1px solid #6ee7b7", borderRadius: "12px",
                    fontSize: "13px", lineHeight: 1.5, color: "#065f46",
                    boxShadow: "0 2px 8px rgba(16,185,129,.15)",
                  }}>
                    {m.text}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: "84%", padding: "9px 12px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user"
                      ? "linear-gradient(135deg,var(--color-accent),var(--color-warm))"
                      : "var(--color-surface)",
                    color: m.role === "user" ? "white" : "var(--color-text)",
                    fontSize: "13px", lineHeight: 1.6, wordBreak: "break-word",
                    boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                  }}>
                    {m.text === "…" ? (
                      <span style={{ display: "flex", gap: "3px", alignItems: "center", height: "16px" }}>
                        {[0,1,2].map(j => (
                          <span key={j} style={{
                            width: "6px", height: "6px", borderRadius: "50%", background: "#9ca3af",
                            animation: "tms-dot .9s infinite", animationDelay: `${j * 0.2}s`,
                            display: "inline-block",
                          }}/>
                        ))}
                      </span>
                    ) : (
                      <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid var(--color-border)",
            display: "flex", gap: "6px", alignItems: "center", flexShrink: 0,
            background: "var(--color-surface)",
          }}>
            {/* Mic button */}
            {hasSR && (
              <button
                onClick={listening ? stopListening : startListening}
                disabled={streaming}
                title={listening ? "Stop recording" : "Speak your message (Hindi/English/Regional)"}
                style={{
                  width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                  background: listening ? "var(--color-warm)" : "color-mix(in srgb,var(--color-accent) 10%,transparent)",
                  border: listening ? "2px solid var(--color-warm)" : "2px solid transparent",
                  cursor: streaming ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: listening ? "tms-pulse-red .8s infinite" : "none",
                  transition: "background .2s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={listening ? "white" : "var(--color-accent)"} strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="11" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>
                </svg>
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? "Listening… speak now" : "Type in English, Hindi, Hinglish…"}
              disabled={streaming}
              style={{
                flex: 1, border: "1px solid var(--color-border)", borderRadius: "20px",
                padding: "8px 14px", fontSize: "13px", outline: "none",
                background: "var(--color-panel)", color: "var(--color-text)", opacity: streaming ? .6 : 1,
              }}
            />

            {/* Send button */}
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              aria-label="Send"
              style={{
                width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                background: input.trim() && !streaming
                  ? "linear-gradient(135deg,var(--color-accent),var(--color-warm))" : "var(--color-border)",
                border: "none", cursor: input.trim() && !streaming ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .2s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !streaming ? "white" : "var(--color-muted)"}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "3px 12px 7px",
            fontSize: "10px", color: "var(--color-muted)", flexShrink: 0,
            background: "var(--color-surface)",
          }}>
            {listening && <span style={{ color: "var(--color-warm)", fontWeight: 600 }}>🔴 Recording… </span>}
            Powered by Groq · Speaks Hindi, English & 8 regional languages
          </div>
        </div>
      )}

      <style>{`
        @keyframes tms-dot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes tms-pulse-red { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-warm) 40%,transparent)} 50%{box-shadow:0 0 0 6px transparent} }
      `}</style>
    </>
  );
}
