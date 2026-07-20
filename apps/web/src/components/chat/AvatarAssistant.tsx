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
type Message = { role: "user" | "bot"; text: string; ts?: number };

const SUBMIT_QUOTE_RE = /SUBMIT_QUOTE:\{[^}]+\}/s;
const GREETING = "Namaste! I'm Tara, your assistant at Tara Maa Solutions. I can help you find the right industrial product, get pricing, or request a quote. How can I help you today?";

// ── Language detection using Unicode script ranges ────────────────────────────
function detectLang(text: string): string {
  if (/[一-鿿㐀-䶿＀-￯　-〿]/.test(text)) return "zh-CN"; // Chinese / Mandarin
  if (/[ऀ-ॿ]/.test(text)) return "hi-IN";  // Devanagari → Hindi / Marathi
  if (/[஀-௿]/.test(text)) return "ta-IN";  // Tamil
  if (/[ఀ-౿]/.test(text)) return "te-IN";  // Telugu
  if (/[ঀ-৿]/.test(text)) return "bn-IN";  // Bengali
  if (/[઀-૿]/.test(text)) return "gu-IN";  // Gujarati
  if (/[ಀ-೿]/.test(text)) return "kn-IN";  // Kannada
  if (/[ഀ-ൿ]/.test(text)) return "ml-IN";  // Malayalam
  if (/[਀-੿]/.test(text)) return "pa-IN";  // Punjabi (Gurmukhi)
  if (/[؀-ۿ]/.test(text)) return "ar-SA";  // Arabic
  // Hinglish — common Hindi words in Latin script
  if (/\b(kya|hai|nahi|haan|bahut|accha|theek|kitna|kyun|kaise|yeh|woh|mera|aapka|bhai|namaste|dhanyawad|chahiye|jaldi|abhi)\b/i.test(text)) return "hi-IN";
  return "en-IN";
}

// ── TTS tuning per language (tonal languages need flat pitch) ─────────────────
const LANG_TTS: Record<string, { rate: number; pitch: number }> = {
  "zh-CN": { rate: 0.85, pitch: 1.0 },
  "zh-TW": { rate: 0.85, pitch: 1.0 },
  "hi-IN": { rate: 0.88, pitch: 1.1 },
  "mr-IN": { rate: 0.88, pitch: 1.1 },
  "ta-IN": { rate: 0.9,  pitch: 1.0 },
  "te-IN": { rate: 0.9,  pitch: 1.0 },
  "bn-IN": { rate: 0.9,  pitch: 1.05 },
  "gu-IN": { rate: 0.9,  pitch: 1.0 },
  "kn-IN": { rate: 0.9,  pitch: 1.0 },
  "ml-IN": { rate: 0.88, pitch: 1.0 },
  "pa-IN": { rate: 0.9,  pitch: 1.05 },
  "ar-SA": { rate: 0.88, pitch: 1.0 },
  "en-IN": { rate: 0.9,  pitch: 1.15 },
};

// TTS queue item (carries language so voice stays correct per sentence)
type SpeechItem = { text: string; lang: string };

// ── Lead analysis (runs client-side, zero extra API cost) ─────────────────────
function analyzeSession(msgs: Message[]) {
  const userText = msgs.filter(m => m.role === "user").map(m => m.text).join(" ").toLowerCase();
  const allText  = msgs.map(m => m.text).join(" ").toLowerCase();

  const signals: string[] = [];
  let score = 0;

  if (/product|machine|printer|automation|equipment|laminat|sublim|electrical|pump|motor|plc|sensor/i.test(userText)) { signals.push("product_interest"); score += 20; }
  if (/price|cost|rate|budget|how much|kitna|daam|rupee|rs\b|₹|quote|quotation/i.test(userText)) { signals.push("price_inquiry"); score += 20; }
  if (/urgent|asap|immediately|jaldi|abhi|this week|by (tomorrow|monday|tuesday|wednesday|thursday|friday)|quick(ly)?/i.test(userText)) { signals.push("urgency"); score += 15; }
  if (/quote|order|buy|purchase|want to (get|order|buy)|place an order/i.test(userText)) { signals.push("quote_requested"); score += 15; }
  if (msgs.filter(m => m.role === "user").length >= 5) { signals.push("high_engagement"); score += 10; }

  const emailMatch = userText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const emailCaptured = emailMatch ? emailMatch[0] : "";
  if (emailCaptured) { signals.push("email_captured"); score += 10; }

  const phoneMatch = userText.match(/(\+91[\s-]?)?[6-9]\d{9}/);
  const phoneCaptured = phoneMatch ? phoneMatch[0] : "";
  if (phoneCaptured) { signals.push("phone_captured"); score += 5; }

  // Products discussed: extract capitalized nouns from bot responses hinting at products
  const productHints = (allText.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g) ?? []).slice(0, 5);

  return {
    leadScore: Math.min(score, 100),
    leadSignals: signals,
    productsDiscussed: productHints,
    emailCaptured,
    phoneCaptured,
    hasQuoteRequest: signals.includes("quote_requested"),
    hasPriceInquiry: signals.includes("price_inquiry"),
    hasUrgency: signals.includes("urgency"),
  };
}

// ── Tara SVG Avatar ───────────────────────────────────────────────────────────
function TaraFace({ state, mouthOpen }: { state: AvatarState; mouthOpen: boolean }) {
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {state === "listening" && <>
        <circle cx="80" cy="90" r="76" stroke="#3B82F6" strokeWidth="2.5" opacity="0.6" className="tara-listen-ring" />
        <circle cx="80" cy="90" r="70" stroke="#3B82F6" strokeWidth="1.5" opacity="0.3" className="tara-listen-ring-2" />
      </>}
      {state === "speaking" && (
        <circle cx="80" cy="90" r="76" stroke="#F59E0B" strokeWidth="2.5" opacity="0.7" className="tara-speak-ring" />
      )}

      {/* Hair back */}
      <ellipse cx="80" cy="72" rx="42" ry="46" fill="#1A0F08" />
      {/* Bun */}
      <circle cx="80" cy="32" r="15" fill="#1A0F08" />
      <circle cx="80" cy="32" r="11" fill="#2C1810" />
      <ellipse cx="76" cy="29" rx="5" ry="4" fill="#3D2315" opacity="0.7" />
      <circle cx="73" cy="27" r="1.5" fill="#D4AF37" />
      <circle cx="80" cy="23" r="1.5" fill="#D4AF37" />
      <circle cx="87" cy="27" r="1.5" fill="#D4AF37" />

      {/* Face */}
      <ellipse cx="80" cy="84" rx="36" ry="42" fill="#EDAB7C" />
      <ellipse cx="80" cy="84" rx="36" ry="42" fill="url(#faceShade)" opacity="0.3" />

      {/* Ears */}
      <ellipse cx="44" cy="86" rx="6" ry="8" fill="#E0976A" />
      <ellipse cx="116" cy="86" rx="6" ry="8" fill="#E0976A" />
      {/* Earrings */}
      <circle cx="44" cy="92" r="4" fill="#D4AF37" /><circle cx="44" cy="92" r="2" fill="#F4D03F" />
      <circle cx="116" cy="92" r="4" fill="#D4AF37" /><circle cx="116" cy="92" r="2" fill="#F4D03F" />

      {/* Eyebrows */}
      <path d="M55 66 Q63 61 72 63.5" stroke="#1A0F08" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M88 63.5 Q97 61 105 66" stroke="#1A0F08" strokeWidth="2.5" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="64" cy="76" rx="10" ry="7.5" fill="white" />
      <ellipse cx="64" cy="76" rx="6" ry="6" fill="#1A0F08" />
      <circle cx="64" cy="76" r="3.5" fill="#0A0604" />
      <circle cx="66" cy="73.5" r="1.8" fill="white" />
      <path d="M54 73 Q64 68 74 73" stroke="#1A0F08" strokeWidth="1.2" fill="none" strokeLinecap="round" />

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

      {/* Mangalsutra */}
      <path d="M62 132 Q80 142 98 132" stroke="#111" strokeWidth="1.5" strokeDasharray="2.5,2" fill="none" />
      <circle cx="80" cy="141" r="2.5" fill="#111" />

      {/* Sari */}
      <path d="M28 180 Q32 148 46 138 Q62 130 80 130 Q98 130 114 138 Q128 148 132 180z" fill="#D97706" />
      <path d="M28 180 Q33 150 48 140 Q64 132 80 132" stroke="#D4AF37" strokeWidth="2" fill="none" />
      <path d="M132 180 Q127 150 112 140 Q96 132 80 132" stroke="#D4AF37" strokeWidth="2" fill="none" />
      <path d="M110 140 Q125 148 132 165 L132 180 L118 170z" fill="#92400E" opacity="0.5" />

      {/* Thinking dots */}
      {state === "thinking" && (
        <g>
          <circle cx="68" cy="152" r="5" fill="#D97706" className="tara-dot-1" />
          <circle cx="80" cy="152" r="5" fill="#D97706" className="tara-dot-2" />
          <circle cx="92" cy="152" r="5" fill="#D97706" className="tara-dot-3" />
        </g>
      )}

      <defs>
        <radialGradient id="faceShade" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F5D5B0" />
          <stop offset="100%" stopColor="#C07840" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Waveform({ active, color = "#3B82F6" }: { active: boolean; color?: string }) {
  const heights = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.75, 0.5];
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-full"
          style={{
            background: color,
            height: active ? `${Math.max(4, h * 20)}px` : "3px",
            animationName: active ? "waveBar" : "none",
            animationDuration: `${0.35 + i * 0.07}s`,
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationTimingFunction: "ease-in-out",
            animationDelay: `${i * 40}ms`,
          }} />
      ))}
    </div>
  );
}

const STYLES = `
  @keyframes waveBar {
    from { transform: scaleY(0.3); }
    to   { transform: scaleY(1); }
  }
  @keyframes taraListenRing {
    0%,100% { opacity:0.3; r:74; }
    50%      { opacity:0.8; r:78; }
  }
  @keyframes taraListenRing2 {
    0%,100% { opacity:0.15; r:68; }
    50%      { opacity:0.5; r:72; }
  }
  @keyframes taraSpeakRing {
    0%   { opacity:0.4; }
    100% { opacity:0.9; }
  }
  @keyframes taraDot {
    0%,60%,100% { transform:translateY(0); opacity:0.4; }
    30%          { transform:translateY(-8px); opacity:1; }
  }
  @keyframes taraBreath {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.012); }
  }
  @keyframes taraButtonPulse {
    0%   { box-shadow: 0 0 0 0 rgba(217,119,6,0.6), 0 4px 24px rgba(0,0,0,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(217,119,6,0), 0 4px 24px rgba(0,0,0,0.4); }
    100% { box-shadow: 0 0 0 0 rgba(217,119,6,0), 0 4px 24px rgba(0,0,0,0.4); }
  }
  .tara-listen-ring   { animation: taraListenRing  1.2s ease-in-out infinite; }
  .tara-listen-ring-2 { animation: taraListenRing2 1.2s ease-in-out 0.2s infinite; }
  .tara-speak-ring    { animation: taraSpeakRing   0.4s ease-in-out infinite alternate; }
  .tara-dot-1 { animation: taraDot 1s ease-in-out 0s    infinite; }
  .tara-dot-2 { animation: taraDot 1s ease-in-out 0.18s infinite; }
  .tara-dot-3 { animation: taraDot 1s ease-in-out 0.36s infinite; }
  .tara-idle  { animation: taraBreath 4s ease-in-out infinite; }
  .tara-btn-pulse { animation: taraButtonPulse 2s ease-out infinite; }
`;

// ── Unique session ID ──────────────────────────────────────────────────────────
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "tara-session-id";
  let id = sessionStorage.getItem(key);
  if (!id) { id = `ts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; sessionStorage.setItem(key, id); }
  return id;
}

// ── Main component ─────────────────────────────────────────────────────────────
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
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const synthRef    = useRef<SpeechSynthesis | null>(null);
  const voicesRef   = useRef<SpeechSynthesisVoice[]>([]);
  const recogRef    = useRef<SRInstance | null>(null);
  const speechQueue = useRef<SpeechItem[]>([]);
  const isSpeaking  = useRef(false);
  const streamBuffer = useRef("");
  const currentLang  = useRef("en-IN");   // tracks detected language of active conversation
  const scrollRef   = useRef<HTMLDivElement>(null);
  const mouthTimer  = useRef<NodeJS.Timeout | null>(null);
  const sessionSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionId   = useRef<string>("");

  // ── Browser API setup ─────────────────────────────────────────────────────
  useEffect(() => {
    sessionId.current = getSessionId();
    synthRef.current  = window.speechSynthesis;
    const tts = "speechSynthesis" in window;
    setHasTTS(tts);

    if (tts) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length) voicesRef.current = v;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const SR = (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
      .SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    setHasSR(!!SR);
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-IN";
      recogRef.current = r as unknown as SRInstance;
    }
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Mouth animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (avatarState === "speaking") {
      mouthTimer.current = setInterval(() => setMouthOpen(o => !o), 220);
    } else {
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      setMouthOpen(false);
    }
    return () => { if (mouthTimer.current) clearInterval(mouthTimer.current); };
  }, [avatarState]);

  // ── Get best voice for a given language ──────────────────────────────────
  const getVoiceForLang = useCallback((lang: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length ? voicesRef.current : (synthRef.current?.getVoices() ?? []);
    const primary = lang.split("-")[0]; // "zh", "hi", "ta", "en", …
    return (
      // 1. Exact match + female preferred
      voices.find(v => v.lang === lang && /female|woman|aditi|heera|lekha/i.test(v.name)) ||
      // 2. Exact language code
      voices.find(v => v.lang === lang) ||
      // 3. Same language family (e.g. zh-CN → zh-TW)
      voices.find(v => v.lang.startsWith(primary + "-") && /female|woman/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith(primary + "-")) ||
      // 4. Named Indian voices as fallback for Indic scripts
      (["hi","mr","gu","ta","te","bn","kn","ml","pa"].includes(primary)
        ? voices.find(v => /aditi|lekha|riya|veena|heera|priya/i.test(v.name)) ?? null
        : null) ||
      // 5. Google Mandarin for Chinese
      (primary === "zh" ? voices.find(v => /google/i.test(v.name) && v.lang.startsWith("zh")) ?? null : null) ||
      // 6. Fallback to Indian English female
      voices.find(v => v.lang === "en-IN" && /female|woman|aditi|heera/i.test(v.name)) ||
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang.startsWith("en")) ||
      null
    );
  }, []);

  // ── TTS queue ─────────────────────────────────────────────────────────────
  const speakNext = useCallback(() => {
    if (!hasTTS || !voiceOn || speechQueue.current.length === 0) {
      isSpeaking.current = false;
      streamBuffer.current = "";
      setAvatarState("idle");
      if (hasSR && voiceOn && isOpen) setTimeout(() => startListening(), 700);
      return;
    }
    const item = speechQueue.current.shift()!;
    const { rate, pitch } = LANG_TTS[item.lang] ?? LANG_TTS["en-IN"];
    const utt = new SpeechSynthesisUtterance(item.text);
    utt.lang  = item.lang;
    utt.rate  = rate;
    utt.pitch = pitch;
    const v = getVoiceForLang(item.lang);
    if (v) utt.voice = v;
    utt.onstart = () => setAvatarState("speaking");
    utt.onend   = () => speakNext();
    utt.onerror = () => speakNext();
    synthRef.current?.speak(utt);
  }, [hasTTS, hasSR, voiceOn, isOpen, getVoiceForLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice recognition ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const r = recogRef.current;
    if (!r || !hasSR) return;
    try {
      // Switch recognition language to match the active conversation language
      r.lang = currentLang.current;
      r.onresult = (e) => {
        const text = e.results[0][0].transcript.trim();
        if (text) sendMessage(text);
      };
      r.onerror = () => setAvatarState("idle");
      r.onend   = () => { if (avatarState === "listening") setAvatarState("idle"); };
      setAvatarState("listening");
      r.start();
    } catch { /* already started or permission denied */ }
  }, [hasSR, avatarState]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setAvatarState("idle");
  }, []);

  // ── Save session to backend (debounced) ────────────────────────────────────
  const saveSession = useCallback((msgs: Message[], submitted = false) => {
    if (!sessionId.current || msgs.length < 2) return;
    if (sessionSaveTimer.current) clearTimeout(sessionSaveTimer.current);
    sessionSaveTimer.current = setTimeout(async () => {
      try {
        const analysis = analyzeSession(msgs);
        await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId.current,
            messages: msgs.slice(-40).map(m => ({ role: m.role, text: m.text.slice(0, 800), timestamp: new Date(m.ts ?? Date.now()) })),
            ...analysis,
            quoteSubmitted: submitted,
          }),
        });
      } catch { /* silent — session save is best-effort */ }
    }, 3000);
  }, []);

  // ── Extract sentences from stream for real-time TTS ───────────────────────
  const extractSentences = useCallback((chunk: string) => {
    streamBuffer.current += chunk;
    const lang = currentLang.current;
    // Chinese uses 。！？ as terminators; other scripts use .!?
    const isChinese = lang.startsWith("zh");
    const re = isChinese
      ? /[^。！？\n]+[。！？\n]/g
      : /[^.!?]*[.!?](?:\s|$)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(streamBuffer.current)) !== null) {
      const s = m[0].trim();
      if (s.length > 1) speechQueue.current.push({ text: s, lang });
      last = re.lastIndex;
    }
    streamBuffer.current = streamBuffer.current.slice(last);
    if (!isSpeaking.current && speechQueue.current.length > 0 && hasTTS && voiceOn) {
      isSpeaking.current = true;
      speakNext();
    }
  }, [hasTTS, voiceOn, speakNext]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    synthRef.current?.cancel();
    speechQueue.current = [];
    isSpeaking.current = false;
    streamBuffer.current = "";
    recogRef.current?.stop();

    setInputText("");
    // Detect language from what the user typed/said — TTS + recognition follow suit
    currentLang.current = detectLang(text);
    const now = Date.now();
    const userMsg: Message = { role: "user", text, ts: now };
    setMessages(prev => [...prev, userMsg]);
    setAvatarState("thinking");

    let fullText = "";

    try {
      const history = messages.slice(-20);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok || !res.body) throw new Error("API error");

      const botPlaceholder: Message = { role: "bot", text: "", ts: Date.now() };
      setMessages(prev => [...prev, botPlaceholder]);

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: "bot", text: fullText, ts: botPlaceholder.ts };
                return next;
              });
              extractSentences(parsed.text);
            }
          } catch { /* streaming parse error */ }
        }
      }

      if (streamBuffer.current.trim()) {
        speechQueue.current.push({ text: streamBuffer.current.trim(), lang: currentLang.current });
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
            next[next.length - 1] = { role: "bot", text: clean, ts: botPlaceholder.ts };
            return next;
          });
          const finalMsgs = [...messages, userMsg, { role: "bot" as const, text: clean, ts: botPlaceholder.ts }];
          await fetch("/api/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              captchaToken: "demo-captcha-token",
              source: "chat",
              chatTranscript: finalMsgs.slice(-20).map(m => ({ role: m.role, text: m.text.slice(0, 500) })),
            }),
          });
          setQuoteSubmitted(true);
          saveSession(finalMsgs, true);
        } catch { /* silent */ }
      } else {
        const finalMsgs = [...messages, userMsg, { role: "bot" as const, text: fullText, ts: Date.now() }];
        saveSession(finalMsgs, quoteSubmitted);
      }

      if (!isOpen) setUnread(n => n + 1);
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "bot", text: "Sorry, I had trouble connecting. Please try again or call us directly.", ts: Date.now() };
        return next;
      });
      setAvatarState("idle");
    }
  }, [messages, hasTTS, voiceOn, extractSentences, speakNext, isOpen, quoteSubmitted, saveSession]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open / close ───────────────────────────────────────────────────────────
  const open = useCallback(() => {
    setIsOpen(true);
    setUnread(0);
    if (!hasOpened) {
      setHasOpened(true);
      const greetMsg: Message = { role: "bot", text: GREETING, ts: Date.now() };
      setMessages([greetMsg]);
      if (hasTTS && voiceOn) {
        speechQueue.current = [{ text: GREETING, lang: "en-IN" }];
        isSpeaking.current = true;
        setTimeout(() => speakNext(), 500);
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
    // Save session on close
    saveSession(messages, quoteSubmitted);
  }, [messages, quoteSubmitted, saveSession]);

  const stateLabel = { idle: "Type or tap mic", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…" }[avatarState];
  const stateColor = { idle: "text-muted", listening: "text-blue-400", thinking: "text-amber-400", speaking: "text-green-400" }[avatarState];

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Floating button — high-contrast, visible on dark backgrounds ── */}
      {!isOpen && (
        <button
          onClick={open}
          aria-label="Talk to Tara, our AI assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5 group"
        >
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white bg-red-500 shadow-lg">
              {unread}
            </span>
          )}

          {/* Avatar circle — white bg ensures visibility on any background */}
          <div
            className="relative h-16 w-16 rounded-full overflow-hidden tara-btn-pulse group-hover:scale-110 transition-transform duration-300"
            style={{
              background: "#FFFFFF",
              border: "3px solid #D97706",
              boxShadow: "0 0 0 0 rgba(217,119,6,0.6), 0 6px 28px rgba(0,0,0,0.45)",
            }}
          >
            <TaraFace state="idle" mouthOpen={false} />
          </div>

          {/* Label */}
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg,#D97706,#92400E)",
              border: "1px solid rgba(255,255,255,0.3)",
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            Tara
          </span>
        </button>
      )}

      {/* ── Expanded panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl"
          style={{
            width: "min(360px, calc(100vw - 2rem))",
            height: "min(600px, calc(100dvh - 2rem))",
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg,#D97706,#92400E)" }}
          >
            <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 bg-white/20 ring-2 ring-white/40">
              <TaraFace state={avatarState} mouthOpen={mouthOpen} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">Tara</div>
              <div className="text-[10px] text-white/75 font-medium">AI Sales Advisor · Tara Maa Solutions</div>
            </div>
            <div className="flex items-center gap-2">
              {hasTTS && (
                <button
                  onClick={() => { setVoiceOn(v => !v); synthRef.current?.cancel(); }}
                  title={voiceOn ? "Mute Tara" : "Unmute Tara"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition-colors"
                >
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
              <button
                onClick={close}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition-colors text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Avatar display */}
          <div className="shrink-0 flex flex-col items-center gap-2 py-4" style={{ background: "var(--color-surface)" }}>
            <div className={`h-32 w-32 ${avatarState === "idle" ? "tara-idle" : ""}`}>
              <TaraFace state={avatarState} mouthOpen={mouthOpen} />
            </div>
            <div className="flex flex-col items-center gap-1">
              {avatarState === "listening" && <Waveform active color="#3B82F6" />}
              {avatarState === "speaking"  && <Waveform active color="#D97706" />}
              {(avatarState === "idle" || avatarState === "thinking") && (
                <div className="h-6 flex items-center">
                  {avatarState === "thinking" && (
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce bg-amber-500"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              )}
              <span className={`text-xs font-semibold ${stateColor}`}>{stateLabel}</span>
            </div>
          </div>

          {/* Transcript */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{ background: "var(--color-panel)" }}
          >
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted pt-4">Start talking to Tara…</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "bot" && (
                  <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 mt-0.5 bg-white ring-1 ring-amber-300">
                    <TaraFace state="idle" mouthOpen={false} />
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === "user"
                    ? { background: "linear-gradient(135deg,#D97706,#92400E)", color: "#fff", borderBottomRightRadius: "4px" }
                    : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderBottomLeftRadius: "4px" }
                  }
                >
                  {m.text || <span className="opacity-40 animate-pulse">●●●</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-3"
            style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}
          >
            {hasSR && (
              <button
                onClick={() => avatarState === "listening" ? stopListening() : startListening()}
                disabled={avatarState === "thinking" || avatarState === "speaking"}
                aria-label={avatarState === "listening" ? "Stop" : "Speak"}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-40"
                style={avatarState === "listening"
                  ? { background: "#EF4444", border: "2px solid #EF4444" }
                  : { background: "rgba(217,119,6,0.12)", border: "1px solid var(--color-border)" }
                }
              >
                {avatarState === "listening" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                )}
              </button>
            )}

            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
              placeholder="Type or tap mic…"
              disabled={avatarState === "thinking" || avatarState === "speaking"}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
            />

            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || avatarState === "thinking" || avatarState === "speaking"}
              aria-label="Send"
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={{ background: inputText.trim() ? "linear-gradient(135deg,#D97706,#92400E)" : "var(--color-border)" }}
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
