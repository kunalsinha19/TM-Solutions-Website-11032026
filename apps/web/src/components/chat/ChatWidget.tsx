"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "bot";
  text: string;
}

const STORAGE_KEY = "tms-chat-history";
const MAX_HISTORY = 20;

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
  } catch {}
}

export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const appendBot = useCallback((text: string) => {
    setMessages(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "bot" && last.text === "…") {
        next[next.length - 1] = { role: "bot", text };
      } else if (last?.role === "bot") {
        next[next.length - 1] = { role: "bot", text: last.text + text };
      } else {
        next.push({ role: "bot", text });
      }
      return next;
    });
  }, []);

  const send = useCallback(async () => {
    const msg = input.trim();
    if (!msg || streaming) return;

    setInput("");
    const userMsg: Message = { role: "user", text: msg };

    setMessages(prev => {
      const next = [...prev, userMsg, { role: "bot" as const, text: "…" }];
      saveHistory(next);
      return next;
    });
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      const history = messages.slice(-MAX_HISTORY).map(m => ({
        role: m.role === "user" ? "user" : "bot",
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
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
            if (firstChunk) {
              // Replace the "…" placeholder with first real text
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "bot") next[next.length - 1] = { role: "bot", text };
                return next;
              });
              firstChunk = false;
            } else {
              appendBot(text);
            }
            fullText += text;

            if (fullText.includes("OPEN_QUOTE_FORM")) {
              const clean = fullText.replace(/OPEN_QUOTE_FORM/g, "").trim();
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "bot") next[next.length - 1] = { role: "bot", text: clean };
                return next;
              });
              saveHistory([...messages, userMsg, { role: "bot", text: clean }]);
              setStreaming(false);
              setOpen(false);
              router.push("/quote");
              return;
            }
          } catch {}
        }
      }

      setMessages(prev => {
        saveHistory(prev);
        return prev;
      });

      if (!open) setUnread(u => u + 1);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      appendBot("Sorry, something went wrong. Please try again or email us at taramaasolutions2025@gmail.com.");
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, open, appendBot, router]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open TMS chat assistant"}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(180,83,9,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {unread > 0 && !open && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#dc2626",
            color: "white",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "10px",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}>{unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: "92px",
          right: "24px",
          zIndex: 9998,
          width: "min(380px, calc(100vw - 32px))",
          height: "min(520px, calc(100dvh - 120px))",
          background: "var(--chat-bg, #ffffff)",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "inherit",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>TMS Assist</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px" }}>
                <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", marginRight: "4px", verticalAlign: "middle" }} />
                Online · Industrial Sales Support
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear conversation"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}
              >Clear</button>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "24px 16px",
                color: "#6b7280",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏭</div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px", color: "#374151" }}>Welcome to TM Solutions</div>
                <div style={{ fontSize: "12px", lineHeight: 1.5 }}>I can help you find the right industrial product, get a quote, or answer questions about our services.</div>
                <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {["What products do you offer?", "I need a quote", "How to contact sales?"].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => send, 0); }}
                      onMouseDown={() => setInput(q)}
                      style={{
                        background: "#fef3c7",
                        border: "1px solid #fbbf24",
                        borderRadius: "20px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                        color: "#92400e",
                      }}
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "82%",
                  padding: "9px 12px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user"
                    ? "linear-gradient(135deg, #b45309, #92400e)"
                    : "var(--chat-bot-bg, #f3f4f6)",
                  color: m.role === "user" ? "white" : "var(--chat-bot-color, #111827)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                  {m.text === "…" ? (
                    <span style={{ display: "flex", gap: "3px", alignItems: "center", height: "16px" }}>
                      {[0, 1, 2].map(j => (
                        <span key={j} style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#9ca3af",
                          animation: "tms-dot-bounce 1.2s infinite",
                          animationDelay: `${j * 0.2}s`,
                          display: "inline-block",
                        }} />
                      ))}
                    </span>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexShrink: 0,
            background: "var(--chat-input-bg, #fafafa)",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about our products…"
              disabled={streaming}
              style={{
                flex: 1,
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "13px",
                outline: "none",
                background: "white",
                color: "#111827",
                opacity: streaming ? 0.6 : 1,
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              aria-label="Send message"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: input.trim() && !streaming
                  ? "linear-gradient(135deg, #b45309, #92400e)"
                  : "#e5e7eb",
                border: "none",
                cursor: input.trim() && !streaming ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !streaming ? "white" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center",
            padding: "4px 12px 8px",
            fontSize: "10px",
            color: "#9ca3af",
            flexShrink: 0,
            background: "var(--chat-input-bg, #fafafa)",
          }}>
            Powered by Google Gemini · TM Solutions AI Assistant
          </div>
        </div>
      )}

      <style>{`
        @keyframes tms-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        :root[data-theme="dark"] {
          --chat-bg: #1e1f23;
          --chat-bot-bg: #2a2b30;
          --chat-bot-color: #e5e7eb;
          --chat-input-bg: #17181c;
        }
        :root[data-theme="green"] {
          --chat-bg: #0f1a0f;
          --chat-bot-bg: #1a2a1a;
          --chat-bot-color: #d1fae5;
          --chat-input-bg: #0a130a;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --chat-bg: #1e1f23;
            --chat-bot-bg: #2a2b30;
            --chat-bot-color: #e5e7eb;
            --chat-input-bg: #17181c;
          }
        }
      `}</style>
    </>
  );
}
