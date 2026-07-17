import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";

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

// Cache system prompt for 5 minutes to avoid DB hits on every message
let cachedPrompt: { text: string; at: number } | null = null;

async function buildSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.at < 5 * 60_000) return cachedPrompt.text;

  let categories: string[] = [];
  let siteName = "Tara Maa Solutions";
  let email = "taramaasolutions2025@gmail.com";
  let phones = "";
  let address = "";

  try {
    const [catRes, setRes] = await Promise.allSettled([
      fetch(`${BACKEND}/categories`, { next: { revalidate: 0 } }),
      fetch(`${BACKEND}/settings`, { next: { revalidate: 0 } }),
    ]);

    if (catRes.status === "fulfilled" && catRes.value.ok) {
      const d = await catRes.value.json();
      categories = (d.categories ?? []).map((c: { name: string }) => c.name).filter(Boolean);
    }
    if (setRes.status === "fulfilled" && setRes.value.ok) {
      const d = await setRes.value.json();
      const s = d.settings ?? d.websiteSettings ?? {};
      siteName = s.siteName ?? siteName;
      email    = s.contactInfo?.email ?? email;
      phones   = [s.contactInfo?.phone, ...(s.contactInfo?.phones ?? [])]
                   .filter(Boolean).join(", ");
      address  = s.contactInfo?.address ?? "";
    }
  } catch { /* use defaults */ }

  const prompt = `You are TMS Assist, the intelligent sales and support assistant for ${siteName} — an industrial products supplier based in India.

PRODUCTS & CATEGORIES:
${categories.length ? categories.map(c => `• ${c}`).join("\n") : "• Industrial equipment, machinery, and automation solutions"}

CONTACT DETAILS:
• Email: ${email}
• Phone: ${phones || "Listed on the website"}
${address ? `• Address: ${address}` : ""}
• Website: tmsolutionsindia.com
• Quote form: /quote

YOUR JOB:
1. Understand the visitor's industrial requirement — ask about load, size, material, application, industry if needed.
2. Match them to the right product category from the list above.
3. Guide them toward submitting a quote request for detailed specifications and pricing.
4. Answer general questions about TMS, delivery, quality, or the ordering process.

STRICT RULES:
• Never invent specifications, prices, or lead times — you don't have that data.
• Keep every reply under 80 words. Be direct and professional.
• When a visitor is ready to request a quote (says "get quote", "send enquiry", "I want to order", "pricing", etc.) — include the exact token OPEN_QUOTE_FORM somewhere in your reply so the system can open the form for them.
• For urgent matters or complaints, give the contact email immediately.
• Never discuss competitors, politics, or anything outside TMS business.`;

  cachedPrompt = { text: prompt, at: Date.now() };
  return prompt;
}

function sseText(data: string): string {
  return `data: ${data}\n\n`;
}

export async function POST(req: NextRequest) {
  const enc = new TextEncoder();
  const sse = (data: string) => enc.encode(sseText(data));

  if (!GEMINI_KEY) {
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
        const systemInstruction = await buildSystemPrompt();
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT,   threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
        });

        const chat = model.startChat({
          history: history.map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        });

        const result = await chat.sendMessageStream(message);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) ctrl.enqueue(sse(JSON.stringify({ text })));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Gemini chat error]", msg);
        const isKeyError = msg.includes("API_KEY") || msg.includes("401") || msg.includes("403") || msg.includes("invalid");
        ctrl.enqueue(sse(JSON.stringify({
          text: isKeyError
            ? "Chat setup issue — admin needs to check the API key. Please contact us at taramaasolutions2025@gmail.com."
            : "I'm having trouble right now. Please try again or reach us at taramaasolutions2025@gmail.com."
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
