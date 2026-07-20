"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// Minimal Web Speech API types — named distinctly to avoid TS DOM lib conflicts
interface SRInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new() => SRInstance;

type AvatarState = "idle" | "listening" | "thinking" | "speaking";
type Message = { role: "user" | "bot"; text: string };

const SUBMIT_QUOTE_RE = /SUBMIT_QUOTE:\{[^}]+\}/s;
const GREETING = "Hi! I'm Tara, your assistant at Tara Maa Solutions. I can help you find the right industrial product, answer questions, or get you a quote. How can I help you today?";

// ── Tara SVG Avatar ───────────────────────────────────────────────────────────
function TaraFace({ state, mouthOpen }: { state: AvatarState; mouthOpen: boolean }) {
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Animated rings */}
      {state === "listening" && <>
        <circle cx="80" cy="90" r="76" stroke="#3B82F6" strokeWidth="2" opacity="0.5" className="tara-listen-ring" />
        <circle cx="80" cy="90" r="70" stroke="#3B82F6" strokeWidth="1" opacity="0.3" className="tara-listen-ring-2" />
      </>}
      {state === "speaking" && (
        <circle cx="80" cy="90" r="76" stroke="var(--color-accent)" strokeWidth="2" opacity="0.6" className="tara-speak-ring" />
      )}

      {/* Hair — back layer */}
      <ellipse cx="80" cy="72" rx="42" ry="46" fill="#1A0F08" />

      {/* Hair bun */}
      <circle cx="80" cy="32" r="15" fill="#1A0F08" />
      <circle cx="80" cy="32" r="11" fill="#2C1810" />
      <ellipse cx="76" cy="29" rx="5" ry="4" fill="#3D2315" opacity="0.7" />
      {/* Bun pins / decoration */}
      <circle cx="73" cy="27" r="1.5" fill="#D4AF37" />
      <circle cx="80" cy="23" r="1.5" fill="#D4AF37" />
      <circle cx="87" cy="27" r="1.5" fill="#D4AF37" />

      {/* Face */}
      <ellipse cx="80" cy="84" rx="36" ry="42" fill="#EDAB7C" />

      {/* Subtle face shading */}
      <ellipse cx="80" cy="84" rx="36" ry="42" fill="url(#faceShade)" opacity="0.3" />

      {/* Ears */}
      <ellipse cx="44" cy="86" rx="6" ry="8" fill="#E0976A" />
      <ellipse cx="116" cy="86" rx="6" ry="8" fill="#E0976A" />

      {/* Earrings */}
      <circle cx="44" cy="92" r="4" fill="#D4AF37" />
      <circle cx="44" cy="92" r="2" fill="#F4D03F" />
      <circle cx="116" cy="92" r="4" fill="#D4AF37" />
      <circle cx="116" cy="92" r="2" fill="#F4D03F" />

      {/* Eyebrows — arched and full */}
      <path d="M55 66 Q63 61 72 63.5" stroke="#1A0F08" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M88 63.5 Q97 61 105 66" stroke="#1A0F08" strokeWidth="2.5" strokeLinecap="round" />

      {/* Left eye */}
      <ellipse cx="64" cy="76" rx="10" ry="7.5" fill="white" />
      <ellipse cx="64" cy="76" rx="6" ry="6" fill="#1A0F08" />
      <circle cx="64" cy="76" r="3.5" fill="#0A0604" />
      <circle cx="66" cy="73.5" r="1.8" fill="white" />
      <path d="M54 73 Q64 68 74 73" stroke="#1A0F08" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Right eye */}
      <ellipse cx="96" cy="76" rx="10" ry="7.5" fill="white" />
      <ellipse cx="96" cy="76" rx="6" ry="6" fill="#1A0F08" />
      <circle cx="96" cy="76" r="3.5" fill="#0A0604" />
      <circle cx="98" cy="73.5" r="1.8" fill="white" />
      <path d="M86 73 Q96 68 106 73" stroke="#1A0F08" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Bindi */}
      <circle cx="80" cy="64" r="3" fill="#9B2335" />
      <circle cx="80" cy="64" r="1.5" fill="#C0392B" />

      {/* Nose */}
      <path d="M80 82 Q77 91 75.5 93 Q80 95 84.5 93 Q83 91 80 82z" fill="#C98B5A" opacity="0.6" />
      <ellipse cx="75.5" cy="93" rx="2.5" ry="1.5" fill="#C98B5A" opacity="0.4" />
      <ellipse cx="84.5" cy="93" rx="2.5" ry="1.5" fill="#C98B5A" opacity="0.4" />

      {/* Cheek blush */}
      <ellipse cx="54" cy="88" rx="10" ry="6" fill="#F08080" opacity="0.15" />
      <ellipse cx="106" cy="88" rx="10" ry="6" fill="#F08080" opacity="0.15" />

      {/* Mouth */}
      {mouthOpen ? (
        <>
          <ellipse cx="80" cy="106" rx="10" ry="7" fill="#A0403A" />
          <ellipse cx="80" cy="104" rx="8" ry="3" fill="white" opacity="0.9" />
          <ellipse cx="80" cy="110" rx="7" ry="2.5" fill="#7B2C28" opacity="0.5" />
        </>
      ) : (
        <>
          <path d="M70 104 Q80 112 90 104" stroke="#B05050" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M70 104 Q80 110 90 104 Q85 107 80 108 Q75 107 70 104z" fill="#B05050" opacity="0.35" />
        </>
      )}

      {/* Neck */}
      <rect x="74" y="124" width="12" height="12" rx="3" fill="#EDAB7C" />
      <line x1="78" y1="124" x2="82" y2="124" stroke="#C98B5A" strokeWidth="0.5" opacity="0.4" />

      {/* Mangalsutra */}
      <path d="M62 132 Q80 142 98 132" stroke="#111" strokeWidth="1.5" strokeDasharray="2.5,2" fill="none" />
      <circle cx="80" cy="141" r="2.5" fill="#111" />

      {/* Sari / blouse */}
      <path d="M28 180 Q32 148 46 138 Q62 130 80 130 Q98 130 114 138 Q128 148 132 180z"
        fill="var(--color-accent)" />
      {/* Gold sari border */}
      <path d="M28 180 Q33 150 48 140 Q64 132 80 132" stroke="#D4AF37" strokeWidth="2" fill="none" />
      <path d="M132 180 Q127 150 112 140 Q96 132 80 132" stroke="#D4AF37" strokeWidth="2" fill="none" />
      {/* Pallu drape */}
      <path d="M110 140 Q125 148 132 165 L132 180 L118 170z" fill="var(--color-warm)" opacity="0.5" />

      {/* Thinking dots — overlay */}
      {state === "thinking" && (
        <g className="tara-think">
          <circle cx="68" cy="152" r="5" fill="var(--color-accent)" className="tara-dot-1" />
          <circle cx="80" cy="152" r="5" fill="var(--color-accent)" className="tara-dot-2" />
          <circle cx="92" cy="152" r="5" fill="var(--color-accent)" className="tara-dot-3" />
        </g>
      )}

      {/* Defs */}
      <defs>
        <radialGradient id="faceShade" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F5D5B0" />
          <stop offset="100%" stopColor="#C07840" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ── Audio waveform bars ───────────────────────────────────────────────────────
function Waveform({ active, color = "#3B82F6" }: { active: boolean; color?: string }) {
  const heights = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.75, 0.5];
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-100"
          style={{
            background: color,
            height: active ? `${Math.max(4, h * 20)}px` : "3px",
            animationName: active ? "waveBar" : "none",
            animationDuration: `${0.35 + i * 0.07}s`,
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationTimingFunction: "ease-in-out",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Keyframe styles injected once ─────────────────────────────────────────────
const STYLES = `
  @keyframes waveBar {
    from { transform: scaleY(0.3); }
    to   { transform: scaleY(1); }
  }
  @keyframes taraListenRing {
    0%,100% { opacity:0.3; r:74; }
    50%      { opacity:0.7; r:78; }
  }
  @keyframes taraListenRing2 {
    0%,100% { opacity:0.15; r:68; }
    50%      { opacity:0.4; r:72; }
  }
  @keyframes taraSpeakRing {
    0%   { opacity:0.3; }
    100% { opacity:0.7; }
  }
  @keyframes taraDot {
    0%,60%,100% { transform:translateY(0); opacity:0.4; }
    30%          { transform:translateY(-8px); opacity:1; }
  }
  @keyframes taraBreath {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.01); }
  }
  .tara-listen-ring   { animation: taraListenRing  1.2s ease-in-out infinite; }
  .tara-listen-ring-2 { animation: taraListenRing2 1.2s ease-in-out 0.2s infinite; }
  .tara-speak-ring    { animation: taraSpeakRing   0.4s ease-in-out infinite alternate; }
  .tara-dot-1 { animation: taraDot 1s ease-in-out 0s   infinite; }
  .tara-dot-2 { animation: taraDot 1s ease-in-out 0.18s infinite; }
  .tara-dot-3 { animation: taraDot 1s ease-in-out 0.36s infinite; }
  .tara-idle  { animation: taraBreath 4s ease-in-out infinite; }
`;

// ── Main component ────────────────────────────────────────────────────────────
export default function AvatarAssistant() {
  const [isOpen, setIsOpen]       = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [mouthOpen, setMouthOpen] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [voiceOn, setVoiceOn]     = useState(true);
  const [hasSR, setHasSR]         = useState(false);
  const [hasTTS, setHasTTS]       = useState(false);
  const [unread, setUnread]       = useState(0);

  const synthRef    = useRef<SpeechSynthesis | null>(null);
  const recogRef    = useRef<SRInstance | null>(null);
  const speechQueue = useRef<string[]>([]);
  const isSpeaking  = useRef(false);
  const streamBuffer = useRef(""); // text accumulated since last sentence extraction
  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const mouthTimer  = useRef<NodeJS.Timeout | null>(null);

  // ── Browser API check ────────────────────────────────────────────────────
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    setHasTTS("speechSynthesis" in window);
    const SR = (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
           ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    setHasSR(!!SR);
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-IN";
      recogRef.current = r as unknown as SRInstance;
    }
  }, []);

  // ── Auto-scroll transcript ───────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Mouth animation while speaking ──────────────────────────────────────
  useEffect(() => {
    if (avatarState === "speaking") {
      mouthTimer.current = setInterval(() => setMouthOpen(o => !o), 220);
    } else {
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      setMouthOpen(false);
    }
    return () => { if (mouthTimer.current) clearInterval(mouthTimer.current); };
  }, [avatarState]);

  // ── TTS: speak next sentence in queue ───────────────────────────────────
  const speakNext = useCallback(() => {
    if (!hasTTS || !voiceOn || speechQueue.current.length === 0) {
      isSpeaking.current = false;
      streamBuffer.current = "";
      setAvatarState("idle");
      // Auto-listen after Tara finishes speaking
      if (hasSR && voiceOn && isOpen) {
        setTimeout(() => startListening(), 700);
      }
      return;
    }
    const sentence = speechQueue.current.shift()!;
    const utt = new SpeechSynthesisUtterance(sentence);
    utt.lang = "en-IN";
    utt.rate = 0.92;
    utt.pitch = 1.1;

    // Prefer a female English/Indian voice if available
    const voices = synthRef.current?.getVoices() ?? [];
    const preferred = voices.find(v =>
      (v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
      v.lang === "en-IN"
    );
    if (preferred) utt.voice = preferred;

    utt.onstart = () => setAvatarState("speaking");
    utt.onend   = () => speakNext();
    utt.onerror = () => speakNext();
    synthRef.current?.speak(utt);
  }, [hasTTS, hasSR, voiceOn, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice recognition ────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const r = recogRef.current;
    if (!r || !hasSR) return;
    try {
      r.onresult = (e) => {
        const text = e.results[0][0].transcript.trim();
        if (text) sendMessage(text);
      };
      r.onerror = () => setAvatarState("idle");
      r.onend   = () => {
        if (avatarState === "listening") setAvatarState("idle");
      };
      setAvatarState("listening");
      r.start();
    } catch { /* already started or permission denied */ }
  }, [hasSR, avatarState]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setAvatarState("idle");
  }, []);

  // ── Extract and queue sentences from streamed text ───────────────────────
  const extractSentences = useCallback((newChunk: string) => {
    streamBuffer.current += newChunk;
    const sentenceRe = /[^.!?]*[.!?](?:\s|$)/g;
    let match: RegExpExecArray | null;
    let lastEnd = 0;
    while ((match = sentenceRe.exec(streamBuffer.current)) !== null) {
      const sentence = match[0].trim();
      if (sentence.length > 3) speechQueue.current.push(sentence);
      lastEnd = sentenceRe.lastIndex;
    }
    streamBuffer.current = streamBuffer.current.slice(lastEnd);

    if (!isSpeaking.current && speechQueue.current.length > 0 && hasTTS && voiceOn) {
      isSpeaking.current = true;
      speakNext();
    }
  }, [hasTTS, voiceOn, speakNext]);

  // ── Send message to Groq AI ──────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    synthRef.current?.cancel();
    speechQueue.current = [];
    isSpeaking.current = false;
    streamBuffer.current = "";
    recogRef.current?.stop();

    setInputText("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setAvatarState("thinking");

    let fullText = "";
    const history = messages.slice(-20);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok || !res.body) throw new Error("API error");

      // Insert placeholder bot message
      setMessages(prev => [...prev, { role: "bot", text: "" }]);

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: "bot", text: fullText };
                return next;
              });
              extractSentences(parsed.text);
            }
          } catch { /* streaming parse error */ }
        }
      }

      // Flush any remaining text as a sentence
      if (streamBuffer.current.trim()) {
        speechQueue.current.push(streamBuffer.current.trim());
        streamBuffer.current = "";
      }
      if (!isSpeaking.current && speechQueue.current.length > 0 && hasTTS && voiceOn) {
        isSpeaking.current = true;
        speakNext();
      }
      if (!hasTTS || !voiceOn) setAvatarState("idle");

      // Handle quote submission token
      const match = SUBMIT_QUOTE_RE.exec(fullText);
      if (match) {
        try {
          const payload = JSON.parse(match[0].replace("SUBMIT_QUOTE:", ""));
          const clean = fullText.replace(match[0], "").trim();
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: "bot", text: clean };
            return next;
          });
          await fetch("/api/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              captchaToken: "demo-captcha-token",
              source: "chat",
              chatTranscript: messages.concat({ role: "bot", text: clean })
                .slice(-20).map(m => ({ role: m.role, text: m.text.slice(0, 500) })),
            }),
          });
        } catch { /* silent */ }
      }

      if (!isOpen) setUnread(n => n + 1);
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "bot", text: "Sorry, I had trouble connecting. Please try again." };
        return next;
      });
      setAvatarState("idle");
    }
  }, [messages, hasTTS, voiceOn, extractSentences, speakNext, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open assistant for the first time → greeting ─────────────────────────
  const open = useCallback(() => {
    setIsOpen(true);
    setUnread(0);
    if (!hasOpened) {
      setHasOpened(true);
      // Greet immediately
      setMessages([{ role: "bot", text: GREETING }]);
      if (hasTTS && voiceOn) {
        speechQueue.current = [GREETING];
        isSpeaking.current = true;
        setTimeout(() => speakNext(), 400);
      }
    }
  }, [hasOpened, hasTTS, voiceOn, speakNext]);

  const close = useCallback(() => {
    synthRef.current?.cancel();
    recogRef.current?.stop();
    speechQueue.current = [];
    isSpeaking.current = false;
    setIsOpen(false);
    setAvatarState("idle");
  }, []);

  // ── Avatar state label ────────────────────────────────────────────────────
  const stateLabel = {
    idle:      "Tap the mic or type below",
    listening: "Listening…",
    thinking:  "Thinking…",
    speaking:  "Speaking…",
  }[avatarState];

  const stateColor = {
    idle:      "text-muted",
    listening: "text-blue-500",
    thinking:  "text-amber-500",
    speaking:  "text-green-500",
  }[avatarState];

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Floating avatar button ── */}
      {!isOpen && (
        <button
          onClick={open}
          aria-label="Talk to Tara, our AI assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 group"
        >
          {/* Unread badge */}
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
              style={{ background: "var(--color-warm)" }}>
              {unread}
            </span>
          )}

          {/* Avatar bubble */}
          <div className="relative h-16 w-16 rounded-full overflow-hidden shadow-2xl ring-2 transition-all duration-300 group-hover:ring-4 group-hover:scale-105"
            style={{ background: "var(--color-panel)", "--tw-ring-color": "var(--color-accent)" } as React.CSSProperties}>
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: "var(--color-accent)" }} />
            <TaraFace state="idle" mouthOpen={false} />
          </div>

          {/* Label */}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
            style={{ background: "var(--color-accent)" }}>
            Tara
          </span>
        </button>
      )}

      {/* ── Expanded panel ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl"
          style={{
            width: "min(360px, calc(100vw - 2rem))",
            height: "min(600px, calc(100dvh - 2rem))",
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))" }}>
            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-white/20">
              <TaraFace state={avatarState} mouthOpen={mouthOpen} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">Tara</div>
              <div className="text-[10px] text-white/70">AI Assistant · TM Solutions</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice toggle */}
              {hasTTS && (
                <button onClick={() => { setVoiceOn(v => !v); synthRef.current?.cancel(); }}
                  title={voiceOn ? "Mute Tara" : "Unmute Tara"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                  {voiceOn ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </button>
              )}
              {/* Close */}
              <button onClick={close} aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-bold">
                ✕
              </button>
            </div>
          </div>

          {/* Avatar + state section */}
          <div className="shrink-0 flex flex-col items-center gap-2 py-4"
            style={{ background: "var(--color-surface)" }}>
            {/* Large animated avatar */}
            <div className={`h-32 w-32 ${avatarState === "idle" ? "tara-idle" : ""}`}>
              <TaraFace state={avatarState} mouthOpen={mouthOpen} />
            </div>

            {/* Waveform / state indicator */}
            <div className="flex flex-col items-center gap-1">
              {avatarState === "listening" && <Waveform active color="#3B82F6" />}
              {avatarState === "speaking"  && <Waveform active color="var(--color-accent)" />}
              {(avatarState === "idle" || avatarState === "thinking") && (
                <div className="h-6 flex items-center">
                  {avatarState === "thinking" && (
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce"
                          style={{ background: "var(--color-accent)", animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              )}
              <span className={`text-xs font-semibold transition-colors ${stateColor}`}>
                {stateLabel}
              </span>
            </div>
          </div>

          {/* Transcript */}
          <div ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{ background: "var(--color-panel)" }}>
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted pt-4">
                Start talking to Tara...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "bot" && (
                  <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 mt-0.5"
                    style={{ background: "var(--color-surface)" }}>
                    <TaraFace state="idle" mouthOpen={false} />
                  </div>
                )}
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === "user"
                    ? { background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))", color: "#fff", borderBottomRightRadius: "4px" }
                    : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderBottomLeftRadius: "4px" }
                  }>
                  {m.text || <span className="opacity-40 animate-pulse">●●●</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-3"
            style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            {/* Mic button */}
            {hasSR && (
              <button
                onClick={() => avatarState === "listening" ? stopListening() : startListening()}
                disabled={avatarState === "thinking" || avatarState === "speaking"}
                aria-label={avatarState === "listening" ? "Stop listening" : "Speak to Tara"}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-40"
                style={avatarState === "listening"
                  ? { background: "#EF4444", border: "2px solid #EF4444" }
                  : { background: "color-mix(in srgb,var(--color-accent) 12%,transparent)", border: "1px solid var(--color-border)" }
                }
              >
                {avatarState === "listening" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                )}
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
              placeholder="Type or tap mic…"
              disabled={avatarState === "thinking" || avatarState === "speaking"}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || avatarState === "thinking" || avatarState === "speaking"}
              aria-label="Send message"
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={{ background: inputText.trim() ? "linear-gradient(135deg,var(--color-accent),var(--color-warm))" : "var(--color-border)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke={inputText.trim() ? "white" : "var(--color-muted)"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1 7h12M7 1l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
