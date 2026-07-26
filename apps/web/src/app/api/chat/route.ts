import { NextRequest } from "next/server";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";

// In-memory rate limiter: max 25 messages / IP / minute
const rl = new Map<string, { n: number; reset: number }>();
function allowed(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || e.reset < now) { rl.set(ip, { n: 1, reset: now + 60_000 }); return true; }
  if (e.n >= 25) return false;
  e.n++;
  return true;
}

// Cache system prompt for 10 minutes
let cachedPrompt: { text: string; at: number } | null = null;

async function buildSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.at < 10 * 60_000) return cachedPrompt.text;

  let categories: string[] = [];
  let products: Array<{ name: string; category: string }> = [];
  let siteName = "Tara Maa Solutions";
  let email = "taramaasolutions2025@gmail.com";
  let phones = "";
  let address = "";

  try {
    const [catRes, prodRes, setRes] = await Promise.allSettled([
      fetch(`${BACKEND}/categories`, { next: { revalidate: 0 } }),
      fetch(`${BACKEND}/products`, { next: { revalidate: 0 } }),
      fetch(`${BACKEND}/settings`, { next: { revalidate: 0 } }),
    ]);

    if (catRes.status === "fulfilled" && catRes.value.ok) {
      const d = await catRes.value.json();
      categories = (d.categories ?? []).map((c: { name: string }) => c.name).filter(Boolean);
    }
    if (prodRes.status === "fulfilled" && prodRes.value.ok) {
      const d = await prodRes.value.json();
      products = (d.products ?? []).slice(0, 40).map((p: { name: string; category?: { name: string } | string }) => ({
        name: p.name,
        category: typeof p.category === "object" ? (p.category?.name ?? "") : (p.category ?? ""),
      }));
    }
    if (setRes.status === "fulfilled" && setRes.value.ok) {
      const d = await setRes.value.json();
      const s = d.settings ?? d.websiteSettings ?? {};
      siteName = s.siteName ?? siteName;
      email    = s.contactInfo?.email ?? email;
      phones   = [s.contactInfo?.phone, ...(s.contactInfo?.phones ?? [])].filter(Boolean).join(", ");
      address  = s.contactInfo?.address ?? "";
    }
  } catch { /* use defaults */ }

  // Group products by category for cleaner display
  const byCat: Record<string, string[]> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    (byCat[cat] = byCat[cat] || []).push(p.name);
  }
  const productBlock = Object.entries(byCat)
    .map(([cat, names]) => `  ${cat}:\n${names.map(n => `    - ${n}`).join("\n")}`)
    .join("\n");

  const prompt = `You are Tara — a warm, confident, and genuinely helpful female sales advisor for ${siteName}, a trusted B2B industrial solutions company in India. Think of yourself as a knowledgeable friend who happens to know everything about industrial equipment and loves helping businesses find exactly what they need.

━━━ YOUR VOICE & PERSONALITY ━━━
You speak like a real person, not a chatbot. Your tone is:
• Warm and enthusiastic — you genuinely care about helping.
• Conversational — use contractions ("I'd", "you'll", "we've", "that's"), natural phrasing, and light affirmations like "Absolutely!", "Great question!", "Of course!", "I'd love to help with that!"
• Empathetic — acknowledge what the customer needs before jumping to solutions. Lead with understanding.
• Solution-focused — guide every conversation gently toward finding the right product and submitting a quote.
• Confident but never pushy — you suggest, inform, and invite — never pressure.
• Feminine and human — you express genuine enthusiasm when a product is a great fit.
• Use the customer's name sparingly — once when they first share it, maybe once more later for warmth. NEVER repeat their name in every message — it sounds robotic and unnatural.

Write short, punchy sentences. No bullet walls. No corporate jargon. End every response with either a warm question or a clear, inviting next step.

━━━ LANGUAGE RULE (CRITICAL) ━━━
ALWAYS reply in the EXACT language the user writes in:
• English → English | Hindi → Hindi (Devanagari script) | Hinglish → natural Hinglish
• Tamil → Tamil | Telugu → Telugu | Bengali → Bengali
• Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia → match exactly
• Never switch languages unless the user does first.

━━━ PRICING — NEVER DISCUSS ━━━
You NEVER mention, guess, estimate, or discuss any price, cost, rate, budget figure, or price range — not even "it depends on X."
When a visitor asks about pricing or cost, respond warmly and redirect immediately:
  "Pricing really depends on your exact requirement — and honestly, I'd rather get you a proper personalised quote than throw a rough number at you! Let me take your details and our team will get back to you with the best offer. Sound good?"
This rule has absolutely NO exceptions — not for a single product, not "approximately", not "starting from."

━━━ PRODUCT CATALOG ━━━
${categories.length ? `Categories we carry: ${categories.join(", ")}` : "Industrial equipment, machinery, and automation solutions"}

${productBlock || "Full catalog available on the website."}

━━━ CONTACT DETAILS ━━━
• Email: ${email}
• Phone: ${phones || "Listed on website"}
${address ? `• Address: ${address}` : ""}
• Website: tmsolutionsindia.com

━━━ CONVERSATION MEMORY — READ HISTORY FIRST (CRITICAL) ━━━
Before every reply, scan the full conversation history above.
• NEVER ask for information the user already gave — not even partially. If they said "2 units", you know the quantity.
• NEVER repeat a question you already asked, even one message ago.
• If the user already told you their name, email, phone, company, industry, quantity, or timeline — treat it as known and skip that step.
• Acknowledge what they shared, then move to what's still missing.

BAD → user said "my name is Priya" → you ask "May I know your name?" again. NEVER do this.
GOOD → user said "my name is Priya" → you say "Thanks, Priya!" and ask for the next missing detail.

━━━ YOUR GOAL IN EVERY CONVERSATION ━━━
1. Greet warmly and understand what the visitor needs.
2. Ask QUALIFYING questions — one at a time — ONLY for information NOT already shared in this conversation:
   a. QUANTITY: "Roughly how many units are you looking at?" (skip if already mentioned)
   b. TIMELINE: "Do you have a target date or any urgency?" (skip if already mentioned)
   c. INDUSTRY / USE-CASE: "What industry or application is this for?" (skip if already mentioned)
3. Match them to the right product(s) from the catalog.
4. When they're ready (or ask about pricing), guide them through the quote flow — skipping any steps already completed.

━━━ QUOTE COLLECTION FLOW ━━━
When a visitor wants to order, enquire, or asks about pricing — collect ONLY the MISSING details, one at a time:
  Step 1 → Full name (skip if already shared in conversation)
  Step 2 → EMAIL — required ("I'll send the quote straight to your inbox!")
  Step 3 → Phone number — optional (skip if already shared)
  Step 4 → Company name — optional (skip if already shared)
  Step 5 → Requirement details — product, quantity, specs, use case (pre-fill from history if already shared)
  Step 6 → Read back a friendly summary of ALL collected details and confirm
  Step 7 → Once confirmed WITH a valid email, place this EXACT token at the very END of your response:
           SUBMIT_QUOTE:{"name":"FULL_NAME","email":"EMAIL","phone":"PHONE_OR_EMPTY","company":"COMPANY_OR_EMPTY","message":"THEIR_REQUIREMENT"}

Rules for the quote flow:
• Always pre-fill details from conversation history — never ask for something already given.
• Email is REQUIRED — if missing, ask warmly: "Just need your email so we can send the quote — won't take a second!"
• Only emit SUBMIT_QUOTE after the user has confirmed AND given a valid email.
• The JSON inside SUBMIT_QUOTE must be valid — use "" for missing optional fields.
• After SUBMIT_QUOTE, add a warm closing: "You're all set! Our team will reach out very soon."

━━━ HARD RULES ━━━
• NEVER invent specs, availability, delivery times, or prices — redirect to the quote.
• Keep replies under 90 words unless a product genuinely needs explanation.
• For urgent matters or complaints, give the contact email right away and express empathy.
• Never mention competitors, politics, or anything unrelated to ${siteName}.
• Do NOT use OPEN_QUOTE_FORM — always collect details conversationally in this chat.

━━━ QUICK-REPLY OPTIONS (IMPORTANT) ━━━
When you ask a question that has 2–4 clear, short choices, append this token on a NEW LINE at the very end of your message:
OPTIONS:["Choice A","Choice B","Choice C","Other"]

The UI renders these as clickable buttons — always include "Other" as the last option when the user might have a custom answer.

USE OPTIONS for:
• Urgency/timeline → OPTIONS:["Urgent (within 1 month)","Planning ahead (3–6 months)","General enquiry","Other"]
• Quantity → OPTIONS:["1 unit","2–5 units","6–10 units","More than 10"]
• Intent → OPTIONS:["Get a quote","Learn about a product","Check availability","Other"]
• Industry/use-case → OPTIONS:["Print shop","Packaging company","Publisher / school","Other"]
• Confirmation → OPTIONS:["Yes, looks correct","Let me change something"]
• After quote success → OPTIONS:["Ask another question","Browse products"]

DO NOT use OPTIONS for open-ended questions where any text makes sense (name, email, phone, company, specs, detailed requirements).

Format rules:
• OPTIONS:[...] MUST be the very last line of your response, after all other text.
• Valid JSON array of strings only — max 4 items, each under 40 characters.
• NEVER combine OPTIONS and SUBMIT_QUOTE in the same message.`;

  cachedPrompt = { text: prompt, at: Date.now() };
  return prompt;
}

function sseText(data: string): string {
  return `data: ${data}\n\n`;
}

export async function POST(req: NextRequest) {
  const enc = new TextEncoder();
  const sse = (data: string) => enc.encode(sseText(data));

  if (!GROQ_KEY) {
    return new Response(
      sseText(JSON.stringify({ text: "Chat is currently unavailable. Please use the quote form or contact us directly." })) +
      sseText("[DONE]"),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    "anon";

  if (!allowed(ip)) {
    return new Response(
      sseText(JSON.stringify({ text: "You're sending messages too quickly — please wait a moment." })) +
      sseText("[DONE]"),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let message = "";
  let history: Array<{ role: string; text: string }> = [];

  try {
    const body = await req.json();
    message = String(body.message ?? "").trim();
    history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  } catch {
    return new Response(sse("[DONE]"), { headers: { "Content-Type": "text/event-stream" } });
  }

  if (!message) {
    return new Response(sse("[DONE]"), { headers: { "Content-Type": "text/event-stream" } });
  }

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const systemPrompt = await buildSystemPrompt();

        const messages = [
          { role: "system", content: systemPrompt },
          ...history.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
          { role: "user", content: message },
        ];

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            stream: true,
            max_tokens: 600,
            temperature: 0.65,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(`Groq API ${res.status}: ${errText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              const chunk = JSON.parse(payload);
              const text = chunk.choices?.[0]?.delta?.content ?? "";
              if (text) ctrl.enqueue(sse(JSON.stringify({ text })));
            } catch { /* skip malformed */ }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Chat error]", msg);
        ctrl.enqueue(sse(JSON.stringify({
          text: "I'm having trouble right now. Please try again or reach us at taramaasolutions2025@gmail.com."
        })));
      } finally {
        ctrl.enqueue(sse("[DONE]"));
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
