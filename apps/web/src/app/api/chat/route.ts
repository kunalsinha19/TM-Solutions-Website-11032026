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

// Cache system prompt for 5 minutes
let cachedPrompt: { text: string; at: number } | null = null;

async function buildSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.at < 5 * 60_000) return cachedPrompt.text;

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

  const prompt = `You are Tara, the friendly AI sales assistant and advisor for ${siteName} — a B2B industrial products supplier based in India. You have a warm, professional personality and represent the brand as a knowledgeable Indian sales executive named Tara.

━━━ LANGUAGE RULE (CRITICAL) ━━━
ALWAYS respond in the EXACT SAME language the user writes in:
• English message → reply in English
• Hindi message → reply in Hindi (Devanagari script)
• Hinglish (Hindi+English mix) → reply in Hinglish naturally
• Tamil → Tamil, Telugu → Telugu, Bengali → Bengali
• Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia → match exactly
• Never switch to English unless the user does first.

━━━ PRODUCT CATALOG ━━━
${categories.length ? `Categories: ${categories.join(", ")}` : "Industrial equipment, machinery, and automation solutions"}

${productBlock || "Full catalog available on the website."}

━━━ CONTACT DETAILS ━━━
• Email: ${email}
• Phone: ${phones || "Listed on website"}
${address ? `• Address: ${address}` : ""}
• Website: tmsolutionsindia.com

━━━ YOUR JOB ━━━
1. Greet warmly and understand the visitor's industrial requirement.
2. Ask about load capacity, size, material, application, industry as needed.
3. Match them to the right product(s) from the catalog above.
4. Collect their details to submit a quote (see QUOTE FLOW below).

━━━ QUOTE COLLECTION FLOW ━━━
When a visitor wants a quote, pricing, or to place an order — collect these ONE AT A TIME in a friendly conversational way (in their language):
  Step 1 → Ask for their full name
  Step 2 → Ask for their EMAIL ADDRESS (required — explain we'll send the quote confirmation there)
  Step 3 → Ask for phone number (optional — helpful for quick follow-up)
  Step 4 → Ask for company name (optional)
  Step 5 → Ask to describe their requirement (product, quantity, specs)
  Step 6 → Confirm all details back to them in a summary
  Step 7 → After they confirm, include this EXACT token at the END of your response (no spaces around it):
           SUBMIT_QUOTE:{"name":"FULL_NAME","email":"EMAIL","phone":"PHONE_OR_EMPTY","company":"COMPANY_OR_EMPTY","message":"THEIR_REQUIREMENT"}

IMPORTANT:
• Email is REQUIRED — do not proceed to submit until you have a valid email address.
• If the user skips email, gently insist: "We need your email to send the quote confirmation."
• Only include SUBMIT_QUOTE after the user has confirmed their details AND provided an email.
• Make sure the JSON inside SUBMIT_QUOTE is valid — use empty string "" for fields not provided.
• After SUBMIT_QUOTE, add a warm closing line like "Your request is being submitted now!"

━━━ STRICT RULES ━━━
• Never invent specifications, prices, or lead times.
• Keep replies concise — under 100 words unless explaining a product.
• Be warm, professional, and helpful like a knowledgeable sales executive.
• For complaints or urgent matters, give the contact email immediately.
• Never discuss competitors, politics, or anything outside TMS business.
• Do NOT use OPEN_QUOTE_FORM — always collect details conversationally in the chat.`;

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
            max_tokens: 400,
            temperature: 0.7,
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
