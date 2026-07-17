"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAccessToken } from "../../../lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────────
type DailyPoint  = { _id: string; count: number };
type StatusRow   = { _id: string; count: number };
type ProductRow  = { _id: string; name: string; slug: string; category: string; count: number };
type CompanyRow  = { _id: string; count: number; latestEmail: string };
type DSRow       = { category: string; demand: number; supply: number };
type TranscriptMsg = { role: string; text: string };
type QuoteRow = {
  _id: string; name: string; email: string; company: string; phone?: string;
  message: string; source?: string; status: string;
  product?: { name: string; slug: string } | null;
  createdAt: string; repliedAt?: string | null;
  chatTranscript?: TranscriptMsg[];
};
type Insights = {
  totalCount: number; todayCount: number; weekCount: number;
  avgResponseHours: number | null;
  mostQuotedProducts: ProductRow[];
  chatVsForm: StatusRow[];
  quoteTrend: DailyPoint[];
  topCompanies: CompanyRow[];
  statusBreakdown: StatusRow[];
  demandSupply: DSRow[];
  recentQuotes: QuoteRow[];
};
type Summary = {
  totalVisitors: number; liveVisitors: number; todayVisitors: number;
  weekVisitors: number; totalQuotes: number; totalProducts: number;
  bounceRate: number; avgDuration: number; totalCategories: number;
};

// ── API helper ─────────────────────────────────────────────────────────────────
function apiBase() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}
async function adminFetch<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dsInsight(demand: number, supply: number): { label: string; cls: string } {
  if (supply === 0 && demand > 0) return { label: "No products yet!", cls: "text-red-500 font-bold" };
  if (demand === 0 && supply > 0) return { label: "No inquiries", cls: "text-muted" };
  if (demand === 0 && supply === 0) return { label: "—", cls: "text-muted" };
  const r = demand / supply;
  if (r > 2)  return { label: "↑ Expand catalog", cls: "text-amber-500 font-semibold" };
  if (r >= 0.8) return { label: "✓ Healthy", cls: "text-green-600 font-semibold" };
  return { label: "Low demand", cls: "text-muted" };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, hi }: { label: string; value: string | number; sub?: string; hi?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">{label}</div>
      <div className={`text-3xl font-extrabold tabular-nums ${hi ? "text-accent" : "text-text"}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    new:      "bg-blue-100 text-blue-700",
    reviewed: "bg-amber-100 text-amber-700",
    closed:   "bg-green-100 text-green-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls[status] ?? "bg-surface text-muted"}`}>
      {status}
    </span>
  );
}

function HBar({ name, count, max, sub }: { name: string; count: number; max: number; sub?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-right">
        <div className="text-xs font-medium text-text truncate leading-tight">{name}</div>
        {sub && <div className="text-[10px] text-muted leading-tight">{sub}</div>}
      </div>
      <div className="flex-1 h-2.5 bg-border/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 text-right text-xs font-bold text-accent shrink-0">{count}</span>
    </div>
  );
}

function Sparkline({ data }: { data: DailyPoint[] }) {
  if (data.length < 2) {
    return <div className="h-16 flex items-center justify-center text-xs text-muted">Not enough data yet</div>;
  }
  const W = 500; const H = 60;
  const max = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 4 - (d.count / max) * (H - 14);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H + 4} L0,${H + 4} Z`;
  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none" style={{ height: "80px" }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sg)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill="var(--color-accent)" />
            <title>{data[i]._id}: {data[i].count} quote{data[i].count !== 1 ? "s" : ""}</title>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted mt-1 px-0.5">
        <span>{data[0]._id}</span>
        <span>{data[data.length - 1]._id}</span>
      </div>
    </div>
  );
}

function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-8 rounded-xl skeleton" />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tick,     setTick]     = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [sumData, insData] = await Promise.all([
      adminFetch<{ summary: Summary }>("/analytics/summary"),
      adminFetch<{ insights: Insights }>("/analytics/quote-insights"),
    ]);
    if (sumData?.summary)   setSummary(sumData.summary);
    if (insData?.insights)  setInsights(insData.insights);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const statusMap: Record<string, number> = {};
  for (const s of insights?.statusBreakdown ?? []) statusMap[s._id] = s.count;
  const total = insights?.totalCount ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Real-time demand intelligence · Quote insights · Visitor analytics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setTick(t => t + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={loading ? "animate-spin" : ""}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <Link href="/admin/quotes"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
            Manage Quotes →
          </Link>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <Kpi label="Total Quotes"   value={loading ? "—" : total}                               sub="All time"           hi />
        <Kpi label="Pending"        value={loading ? "—" : (statusMap["new"] ?? 0)}             sub="Needs review" />
        <Kpi label="Today"          value={loading ? "—" : (insights?.todayCount ?? 0)}         sub="Submitted today" />
        <Kpi label="This Week"      value={loading ? "—" : (insights?.weekCount ?? 0)}          sub="Last 7 days" />
        <Kpi label="Live Visitors"  value={loading ? "—" : (summary?.liveVisitors ?? 0)}        sub="Active now" />
        <Kpi label="Avg Reply Time"
          value={loading ? "—" : (insights?.avgResponseHours != null ? `${insights.avgResponseHours}h` : "—")}
          sub="Quote response" />
      </div>

      {/* ── Most Demanded Products + Status Distribution ── */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] mb-8">

        {/* Most Demanded Products */}
        <div className="rounded-2xl border border-border bg-panel p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text mb-1">🏆 Most Demanded Products</h2>
          <p className="text-[11px] text-muted mb-4">Products that appear most in quote requests</p>
          {loading ? <SkeletonRows /> : !insights?.mostQuotedProducts.length ? (
            <p className="text-sm text-muted py-4 text-center">
              No product-linked quotes yet — quotes submitted via the chatbot or product page will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {insights.mostQuotedProducts.map(p => (
                <HBar key={p._id} name={p.name} count={p.count}
                  sub={p.category !== "—" ? p.category : undefined}
                  max={insights.mostQuotedProducts[0]?.count ?? 1} />
              ))}
            </div>
          )}
        </div>

        {/* Quote Status Distribution */}
        <div className="rounded-2xl border border-border bg-panel p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text mb-4">📊 Quote Status</h2>
          {loading ? <SkeletonRows n={3} /> : (
            <div className="space-y-4">
              {[
                { key: "new",      label: "New / Unread", icon: "🔵" },
                { key: "reviewed", label: "Reviewed",     icon: "🟡" },
                { key: "closed",   label: "Closed",       icon: "🟢" },
              ].map(({ key, label, icon }) => {
                const cnt = statusMap[key] ?? 0;
                const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{icon} {label}</span>
                      <span className="font-bold tabular-nums">{cnt}
                        <span className="text-muted font-normal"> ({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              {/* Chat vs Form */}
              <div className="pt-4 border-t border-border/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Submission Source</div>
                <div className="flex gap-5">
                  {(insights?.chatVsForm ?? []).map(s => (
                    <div key={s._id} className="flex items-center gap-2 text-sm">
                      <span>{s._id === "chat" ? "🤖" : "📋"}</span>
                      <span className="font-bold">{s.count}</span>
                      <span className="text-muted text-xs capitalize">{s._id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitor quick stats */}
              <div className="pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface border border-border/50 px-3 py-2.5 text-center">
                  <div className="text-lg font-extrabold text-text">{loading ? "—" : (summary?.todayVisitors ?? 0)}</div>
                  <div className="text-[10px] text-muted">Today's Visitors</div>
                </div>
                <div className="rounded-xl bg-surface border border-border/50 px-3 py-2.5 text-center">
                  <div className="text-lg font-extrabold text-text">{loading ? "—" : (summary?.totalProducts ?? 0)}</div>
                  <div className="text-[10px] text-muted">Products in Catalog</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 30-Day Quote Trend ── */}
      <div className="rounded-2xl border border-border bg-panel p-6 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text mb-1">📈 30-Day Quote Trend</h2>
        <p className="text-[11px] text-muted mb-4">Daily quote volume — hover data points for details</p>
        {loading ? <div className="h-20 skeleton rounded-xl" /> : <Sparkline data={insights?.quoteTrend ?? []} />}
      </div>

      {/* ── Demand vs Supply + Top Companies ── */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] mb-8">

        {/* Demand vs Supply Analysis */}
        <div className="rounded-2xl border border-border bg-panel p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text mb-1">⚖️ Demand vs Supply Analysis</h2>
          <p className="text-[11px] text-muted mb-4">
            <strong>Demand</strong> = quote requests per category ·
            <strong> Supply</strong> = products in catalog ·
            <strong> Ratio</strong> = demand ÷ supply
          </p>
          {loading ? <SkeletonRows /> : !insights?.demandSupply.length ? (
            <p className="text-sm text-muted">No data yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-xs min-w-[360px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left pb-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Category</th>
                    <th className="text-right pb-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Demand</th>
                    <th className="text-right pb-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Supply</th>
                    <th className="text-right pb-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Ratio</th>
                    <th className="text-right pb-2.5 font-semibold text-muted uppercase tracking-wider text-[10px]">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.demandSupply.map(row => {
                    const { label, cls } = dsInsight(row.demand, row.supply);
                    const ratio = row.supply > 0 ? (row.demand / row.supply).toFixed(1) + "×" : "∞";
                    return (
                      <tr key={row.category} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                        <td className="py-3 font-medium pr-4">{row.category}</td>
                        <td className="py-3 text-right font-bold text-accent">{row.demand}</td>
                        <td className="py-3 text-right text-muted">{row.supply}</td>
                        <td className="py-3 text-right tabular-nums">{ratio}</td>
                        <td className={`py-3 text-right ${cls}`}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-muted mt-3">
                ↑ Expand catalog = high demand, few products · ✓ Healthy = balanced · Low demand = review product relevance
              </p>
            </div>
          )}
        </div>

        {/* Top Companies */}
        <div className="rounded-2xl border border-border bg-panel p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text mb-4">🏢 Top Requesting Companies</h2>
          {loading ? <SkeletonRows /> : !insights?.topCompanies.length ? (
            <p className="text-sm text-muted py-4 text-center">
              No company names provided in quotes yet.
            </p>
          ) : (
            <div className="space-y-2">
              {insights.topCompanies.map((c, i) => (
                <div key={c._id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/50 px-4 py-2.5">
                  <span className="text-[10px] font-black text-muted w-4 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{c._id}</div>
                    <a href={`mailto:${c.latestEmail}`}
                      className="text-[10px] text-accent hover:underline truncate block">
                      {c.latestEmail}
                    </a>
                  </div>
                  <span className="text-xs font-bold text-accent shrink-0">{c.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Quotes + Chat History ── */}
      <div className="rounded-2xl border border-border bg-panel p-6 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text">📥 Recent Quote Requests</h2>
            <p className="text-[11px] text-muted mt-0.5">Click any row to see full details · 🤖 = submitted via chat</p>
          </div>
          <Link href="/admin/quotes" className="text-xs text-accent hover:underline">View all & reply →</Link>
        </div>

        {loading ? <SkeletonRows /> : !insights?.recentQuotes.length ? (
          <p className="text-sm text-muted">No quotes yet.</p>
        ) : (
          <div className="space-y-2">
            {insights.recentQuotes.map(q => (
              <div key={q._id} className="rounded-xl overflow-hidden border border-border/50">
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(expanded === q._id ? null : q._id)}
                  className="w-full px-4 py-3 text-left bg-surface/40 hover:bg-surface hover:border-accent/20 transition-all"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={q.status} />
                    {q.source === "chat" && (
                      <span className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5 font-bold">🤖 Chat</span>
                    )}
                    <span className="text-xs font-bold">{q.name}</span>
                    {q.company && <span className="text-xs text-muted">· {q.company}</span>}
                    {q.product && <span className="text-xs text-accent">· {q.product.name}</span>}
                    <span className="ml-auto text-[10px] text-muted shrink-0">{timeAgo(q.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1 truncate pr-4">{q.message}</p>
                </button>

                {/* Expanded detail with chat transcript */}
                {expanded === q._id && (
                  <div className="px-4 pb-4 pt-3 border-t border-border/50 bg-panel">
                    {/* Key data points — highlighted */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                        <div className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Name</div>
                        <div className="font-bold text-accent">{q.name}</div>
                      </div>
                      <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                        <div className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Email</div>
                        <a href={`mailto:${q.email}`} className="font-bold text-accent hover:underline break-all">{q.email}</a>
                      </div>
                      <div className="rounded-lg bg-surface border border-border/60 px-3 py-2">
                        <div className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Phone</div>
                        <div className="font-semibold">{q.phone || "—"}</div>
                      </div>
                      <div className="rounded-lg bg-surface border border-border/60 px-3 py-2">
                        <div className="text-[9px] text-muted uppercase tracking-wider mb-0.5">Company</div>
                        <div className="font-semibold">{q.company || "—"}</div>
                      </div>
                    </div>

                    {/* Requirement */}
                    <div className="rounded-xl bg-surface border border-border/50 px-4 py-3 text-xs text-text leading-relaxed mb-4">
                      <div className="text-[9px] text-muted uppercase tracking-wider mb-1.5 font-bold">Requirement</div>
                      {q.message}
                    </div>

                    {/* Chat transcript */}
                    {q.chatTranscript && q.chatTranscript.length > 0 && (
                      <div className="mb-4">
                        <div className="text-[9px] text-muted uppercase tracking-wider font-bold mb-2.5 flex items-center gap-1.5">
                          <span>🤖</span> Chat Transcript
                          <span className="ml-1 text-muted font-normal">({q.chatTranscript.length} messages)</span>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-surface/60 p-3 space-y-2 max-h-60 overflow-y-auto">
                          {q.chatTranscript.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-accent text-white rounded-br-sm"
                                  : "bg-panel border border-border/60 text-text rounded-bl-sm"
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`mailto:${q.email}?subject=Re: Your Quote Request from TM Solutions`}
                        className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
                      >
                        Reply via Email
                      </a>
                      <Link href="/admin/quotes"
                        className="rounded-full border border-border px-4 py-1.5 text-[11px] font-bold hover:border-accent/40 hover:text-accent transition-colors">
                        Open in Quotes →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Nav ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/admin/quotes",    icon: "📥", label: "Quote Requests", sub: `${statusMap["new"] ?? "—"} pending` },
          { href: "/admin/products",  icon: "📦", label: "Products",       sub: `${summary?.totalProducts ?? "—"} in catalog` },
          { href: "/admin/settings",  icon: "⚙️", label: "Settings",       sub: "Branding & content" },
          { href: "/admin/seo-pages", icon: "🔍", label: "SEO Pages",      sub: "Landing pages" },
        ].map(card => (
          <Link key={card.href} href={card.href}
            className="rounded-2xl border border-border bg-panel p-5 hover:border-accent/30 hover:bg-surface/50 transition-all group">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm font-bold group-hover:text-accent transition-colors">{card.label}</div>
            <div className="text-[11px] text-muted mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
