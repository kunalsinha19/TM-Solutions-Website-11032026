import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  in_stock:    { label: "In Stock",    color: "#059669", bg: "#d1fae5", border: "#6ee7b7" },
  low_stock:   { label: "Low Stock",   color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  out_of_stock:{ label: "Out of Stock",color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  in_transit:  { label: "In Transit",  color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  unallocated: { label: "Unallocated", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
};

const LOCATIONS = ["showroom", "godown", "transit"];
const LOC_LABELS = { showroom: "Showroom", godown: "Godown", transit: "Transit" };
const LOC_COLORS = { showroom: "#0369a1", godown: "#b45309", transit: "#7c3aed" };

const EMPTY_FORM = {
  sNo: "", shippingMark: "", description: "", category: "",
  pkg: "", pcs: "", soldPcs: "", soldDate: "",
  showroomQty: "", godownQty: "", transitQty: "", notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function num(v) { return Number(v) || 0; }
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.unallocated;
  return (
    <span className="sm-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`lm-toast lm-toast--${toast.type}`}>
      <span className="lm-toast-icon">{toast.type === "success" ? "✓" : "✕"}</span>
      {toast.message}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, onClick, active }) {
  return (
    <button
      className={`sm-stat-card${active ? " sm-stat-card--active" : ""}`}
      style={{ "--sm-accent": color }}
      onClick={onClick}
    >
      <span className="sm-stat-value" style={{ color }}>{value}</span>
      <span className="sm-stat-label">{label}</span>
    </button>
  );
}

// ── Location Bar ──────────────────────────────────────────────────────────────
function LocationBar({ showroom, godown, transit }) {
  const total = num(showroom) + num(godown) + num(transit);
  if (!total) return <span className="sm-loc-empty">—</span>;
  return (
    <div className="sm-loc-bar">
      {num(showroom) > 0 && (
        <span className="sm-loc-chip" style={{ background: "#dbeafe", color: "#1e40af" }}>
          🏪 {showroom}
        </span>
      )}
      {num(godown) > 0 && (
        <span className="sm-loc-chip" style={{ background: "#fef3c7", color: "#92400e" }}>
          🏭 {godown}
        </span>
      )}
      {num(transit) > 0 && (
        <span className="sm-loc-chip" style={{ background: "#ede9fe", color: "#5b21b6" }}>
          🚚 {transit}
        </span>
      )}
    </div>
  );
}

// ── Item Form Modal ───────────────────────────────────────────────────────────
function ItemModal({ item, onSave, onClose, saving }) {
  const [form, setForm] = useState(item ? {
    sNo: item.sNo ?? "",
    shippingMark: item.shippingMark ?? "",
    description:  item.description ?? "",
    category:     item.category ?? "",
    pkg:          item.pkg ?? "",
    pcs:          item.pcs ?? "",
    soldPcs:      item.soldPcs ?? "",
    soldDate:     item.soldDate ? item.soldDate.slice(0, 10) : "",
    showroomQty:  item.showroomQty ?? "",
    godownQty:    item.godownQty ?? "",
    transitQty:   item.transitQty ?? "",
    notes:        item.notes ?? "",
  } : { ...EMPTY_FORM });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handle = e => set(e.target.name, e.target.value);

  const unsold = num(form.pcs) - num(form.soldPcs);
  const avail  = num(form.showroomQty) + num(form.godownQty) + num(form.transitQty);

  return (
    <div className="lm-modal-overlay" onClick={onClose}>
      <div className="sm-form-modal" onClick={e => e.stopPropagation()}>
        <div className="sm-form-header">
          <h3 className="sm-form-title">{item ? "Edit Stock Item" : "Add Stock Item"}</h3>
          <button className="lm-bulk-close" onClick={onClose}>✕</button>
        </div>

        <div className="sm-form-grid">
          <label className="lc-field">
            <span>S.No</span>
            <input name="sNo" type="number" value={form.sNo} onChange={handle} placeholder="1" />
          </label>
          <label className="lc-field">
            <span>Shipping Mark *</span>
            <input name="shippingMark" value={form.shippingMark} onChange={handle} placeholder="TMS-1" style={{ textTransform: "uppercase" }} />
          </label>
          <label className="lc-field sm-col-2">
            <span>Description *</span>
            <input name="description" value={form.description} onChange={handle} placeholder="Paper Cutter 4908" />
          </label>
          <label className="lc-field">
            <span>Category</span>
            <input name="category" value={form.category} onChange={handle} placeholder="Paper Cutters" />
          </label>
          <label className="lc-field">
            <span>PKG (packages)</span>
            <input name="pkg" type="number" value={form.pkg} onChange={handle} min="0" />
          </label>
          <label className="lc-field">
            <span>PCS (total units)</span>
            <input name="pcs" type="number" value={form.pcs} onChange={handle} min="0" />
          </label>
          <label className="lc-field">
            <span>Sold (Pcs)</span>
            <input name="soldPcs" type="number" value={form.soldPcs} onChange={handle} min="0" />
          </label>
          <label className="lc-field">
            <span>Sold Date</span>
            <input name="soldDate" type="date" value={form.soldDate} onChange={handle} />
          </label>
        </div>

        <div className="sm-form-section-title">📍 Location Breakdown</div>
        <div className="sm-form-grid">
          <label className="lc-field">
            <span>🏪 Showroom</span>
            <input name="showroomQty" type="number" value={form.showroomQty} onChange={handle} min="0" />
          </label>
          <label className="lc-field">
            <span>🏭 Godown</span>
            <input name="godownQty" type="number" value={form.godownQty} onChange={handle} min="0" />
          </label>
          <label className="lc-field">
            <span>🚚 Transit</span>
            <input name="transitQty" type="number" value={form.transitQty} onChange={handle} min="0" />
          </label>
          <div className="sm-form-calc">
            <span>Unsold: <strong style={{ color: unsold > 0 ? "#059669" : "#dc2626" }}>{Math.max(0, unsold)}</strong></span>
            <span>Located: <strong>{avail}</strong></span>
            {avail > Math.max(0, unsold) && (
              <span style={{ color: "#dc2626" }}>⚠ Located exceeds unsold</span>
            )}
          </div>
        </div>

        <label className="lc-field" style={{ marginTop: "0.5rem" }}>
          <span>Notes</span>
          <textarea name="notes" rows={2} value={form.notes} onChange={handle} placeholder="Any remarks…" />
        </label>

        <div className="lc-reply-actions" style={{ marginTop: "1.25rem" }}>
          <button className="lc-send-btn" onClick={() => onSave(form)} disabled={saving || !form.shippingMark || !form.description}>
            {saving ? <><span className="lc-spinner" /> Saving…</> : (item ? "Update Item" : "Add Item")}
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Sell Modal ─────────────────────────────────────────────────────────────────
function SellModal({ item, onConfirm, onClose, saving }) {
  const [qty, setQty] = useState(1);
  const [from, setFrom] = useState("showroom");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const unsold = item.unsold ?? Math.max(0, num(item.pcs) - num(item.soldPcs));
  return (
    <div className="lm-modal-overlay" onClick={onClose}>
      <div className="lm-modal" onClick={e => e.stopPropagation()}>
        <div className="lm-modal-icon">💰</div>
        <h3 className="lm-modal-title">Record Sale</h3>
        <p className="lm-modal-body">{item.shippingMark} — {item.description}<br/>
          <strong>{unsold}</strong> units available
        </p>
        <div className="sm-form-grid" style={{ marginBottom: "1rem" }}>
          <label className="lc-field">
            <span>Quantity Sold</span>
            <input type="number" value={qty} min={1} max={unsold} onChange={e => setQty(Number(e.target.value))} />
          </label>
          <label className="lc-field">
            <span>From Location</span>
            <select value={from} onChange={e => setFrom(e.target.value)} className="lc-status-select">
              <option value="showroom">🏪 Showroom</option>
              <option value="godown">🏭 Godown</option>
              <option value="transit">🚚 Transit</option>
            </select>
          </label>
          <label className="lc-field">
            <span>Sale Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
        </div>
        <div className="lm-modal-actions">
          <button className="lc-send-btn" onClick={() => onConfirm({ qty, fromLocation: from, soldDate: date })} disabled={saving || qty <= 0 || qty > unsold}>
            {saving ? <><span className="lc-spinner" /> Recording…</> : `Record Sale of ${qty}`}
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Move Modal ────────────────────────────────────────────────────────────────
function MoveModal({ item, onConfirm, onClose, saving }) {
  const [qty, setQty] = useState(1);
  const [from, setFrom] = useState("godown");
  const [to, setTo]     = useState("showroom");
  return (
    <div className="lm-modal-overlay" onClick={onClose}>
      <div className="lm-modal" onClick={e => e.stopPropagation()}>
        <div className="lm-modal-icon">📦</div>
        <h3 className="lm-modal-title">Move Stock</h3>
        <p className="lm-modal-body">{item.shippingMark} — {item.description}</p>
        <div className="sm-form-grid" style={{ marginBottom: "1rem" }}>
          <label className="lc-field">
            <span>Quantity</span>
            <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} />
          </label>
          <label className="lc-field">
            <span>From</span>
            <select value={from} onChange={e => setFrom(e.target.value)} className="lc-status-select">
              <option value="showroom">🏪 Showroom ({item.showroomQty || 0})</option>
              <option value="godown">🏭 Godown ({item.godownQty || 0})</option>
              <option value="transit">🚚 Transit ({item.transitQty || 0})</option>
            </select>
          </label>
          <label className="lc-field">
            <span>To</span>
            <select value={to} onChange={e => setTo(e.target.value)} className="lc-status-select">
              <option value="showroom">🏪 Showroom</option>
              <option value="godown">🏭 Godown</option>
              <option value="transit">🚚 Transit</option>
            </select>
          </label>
        </div>
        <div className="lm-modal-actions">
          <button className="lc-send-btn" onClick={() => onConfirm({ qty, from, to })} disabled={saving || from === to}>
            {saving ? <><span className="lc-spinner" /> Moving…</> : `Move ${qty} → ${LOC_LABELS[to]}`}
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteConfirm({ item, onConfirm, onClose, deleting }) {
  return (
    <div className="lm-modal-overlay" onClick={onClose}>
      <div className="lm-modal" onClick={e => e.stopPropagation()}>
        <div className="lm-modal-icon">🗑️</div>
        <h3 className="lm-modal-title">Delete Item?</h3>
        <p className="lm-modal-body">Permanently delete <strong>{item.shippingMark}</strong> — {item.description}? This cannot be undone.</p>
        <div className="lm-modal-actions">
          <button className="lm-delete-confirm-btn" onClick={onConfirm} disabled={deleting}>
            {deleting ? <><span className="lc-spinner" /> Deleting…</> : "Yes, Delete"}
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── CSV Import Panel ───────────────────────────────────────────────────────────
function ImportPanel({ token, onDone, onClose }) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    setLoading(true);
    setResult(null);
    try {
      // Parse TSV (Google Sheets) or CSV (exported file)
      // Columns: S.No | Shipping Mark | Description | Category | PKG | PCS | Sold (Pcs) | Sold Date | Unsold (skip) | Showroom | Godown | Transit
      const lines = raw.trim().split("\n").filter(l => l.trim());

      // Auto-detect delimiter: tab = Google Sheets paste, comma = CSV file
      const sample = lines.find(l => l.trim()) || "";
      const delim  = sample.includes("\t") ? "\t" : ",";

      const isHeader = /s\.?no|shipping/i.test(lines[0]);
      const dataLines = isHeader ? lines.slice(1) : lines;

      // Auto-detect whether data has a Category column (12-col our export) or not (11-col Google Sheet)
      const firstRow = dataLines[0]?.split(delim) || [];
      const hasCatCol = firstRow.length >= 12;
      // Indices shift by 1 when Category column is present
      const CI = hasCatCol
        ? { cat:3, pkg:4, pcs:5, sold:6, date:7, room:9, down:10, tran:11 }
        : { cat:-1, pkg:3, pcs:4, sold:5, date:6, room:8, down:9, tran:10 };

      const stripNum = s => Number((s || "").replace(/,/g, "")) || 0;

      const items = dataLines.map(line => {
        const cols = line.split(delim).map(c => c.trim().replace(/^"|"$/g, ""));
        return {
          sNo:          cols[0] ? Number(cols[0]) : undefined,
          shippingMark: (cols[1] || "").toUpperCase().trim(),
          description:  (cols[2] || "").trim(),
          category:     CI.cat >= 0 ? (cols[CI.cat] || "").trim() : "",
          pkg:          stripNum(cols[CI.pkg]),
          pcs:          stripNum(cols[CI.pcs]),
          soldPcs:      stripNum(cols[CI.sold]),
          soldDate:     cols[CI.date] || null,
          // Unsold column is computed — skip
          showroomQty:  stripNum(cols[CI.room]),
          godownQty:    stripNum(cols[CI.down]),
          transitQty:   stripNum(cols[CI.tran]),
        };
      }).filter(i => i.shippingMark && i.description);

      if (!items.length) {
        setResult({ error: `No valid rows found (detected delimiter: ${delim === "\t" ? "TAB — Google Sheets paste OK" : "comma"}). Make sure column 2 = Shipping Mark and column 3 = Description.` });
        return;
      }

      const res = await api.bulkImportStock(token, items);
      setResult(res);
      if (res.created + res.updated > 0) onDone();
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lm-bulk-reply-overlay" onClick={onClose}>
      <div className="lm-bulk-reply-panel" onClick={e => e.stopPropagation()}>
        <div className="lm-bulk-reply-header">
          <div>
            <p className="lm-bulk-reply-title">📥 Import from CSV</p>
            <p className="lm-bulk-reply-sub">Paste directly from Google Sheets (tab-separated) or a CSV file. Columns: S.No · Shipping Mark · Description · Category · PKG · PCS · Sold · Sold Date · Unsold · Showroom · Godown · Transit</p>
          </div>
          <button className="lm-bulk-close" onClick={onClose}>✕</button>
        </div>
        <label className="lc-field">
          <span>CSV Data</span>
          <textarea rows={10} value={raw} onChange={e => setRaw(e.target.value)} placeholder={"Copy-paste directly from Google Sheets — tab-separated is fine.\nOr comma-separated: 1,TMS-1,Paper Cutter 4908,Cutters,6,6,1,,5,0,0"} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} />
        </label>
        {result && (
          <div className={`sm-import-result ${result.error ? "sm-import-result--error" : ""}`}>
            {result.error
              ? `❌ Error: ${result.error}`
              : `✓ Created: ${result.created}  Updated: ${result.updated}  Failed: ${result.failed}`
            }
            {result.errors?.length > 0 && (
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="lc-reply-actions" style={{ marginTop: "1rem" }}>
          <button className="lc-send-btn" onClick={handleImport} disabled={loading || !raw.trim()}>
            {loading ? <><span className="lc-spinner" /> Importing…</> : "Import"}
          </button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StockManager({ token }) {
  const [items, setItems]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState(null);

  // Modals
  const [formModal, setFormModal]     = useState(null); // null | { item } | { item: null }
  const [sellModal, setSellModal]     = useState(null);
  const [moveModal, setMoveModal]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [importOpen, setImportOpen]   = useState(false);

  // Action state
  const [saving, setSaving]   = useState(false);
  const [acting, setActing]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef(null);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function load(q = search, st = statusFilter) {
    try {
      const [stockRes, statsRes] = await Promise.all([
        api.getStock(token, { q: q || undefined, status: st || undefined }),
        api.getStockStats(token),
      ]);
      setItems(stockRes.items || []);
      setStats(statsRes.stats);
    } catch (e) {
      showToast("error", e.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(v, statusFilter), 400);
  }

  function filterStatus(st) {
    const next = statusFilter === st ? "" : st;
    setStatusFilter(next);
    load(search, next);
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function saveItem(form) {
    setSaving(true);
    try {
      const payload = {
        sNo:         form.sNo !== "" ? Number(form.sNo) : undefined,
        shippingMark: form.shippingMark.toUpperCase(),
        description:  form.description,
        category:     form.category,
        pkg:          num(form.pkg),
        pcs:          num(form.pcs),
        soldPcs:      num(form.soldPcs),
        soldDate:     form.soldDate || null,
        showroomQty:  num(form.showroomQty),
        godownQty:    num(form.godownQty),
        transitQty:   num(form.transitQty),
        notes:        form.notes,
      };
      if (formModal?.item?._id) {
        await api.updateStockItem(token, formModal.item._id, payload);
        showToast("success", `Updated ${payload.shippingMark}`);
      } else {
        await api.createStockItem(token, payload);
        showToast("success", `Added ${payload.shippingMark}`);
      }
      setFormModal(null);
      load();
    } catch (e) {
      showToast("error", e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteStockItem(token, deleteModal._id);
      showToast("success", `Deleted ${deleteModal.shippingMark}`);
      setDeleteModal(null);
      load();
    } catch (e) {
      showToast("error", e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmSale(payload) {
    setActing(true);
    try {
      await api.recordSale(token, sellModal._id, payload);
      showToast("success", `Sale of ${payload.qty} recorded for ${sellModal.shippingMark}`);
      setSellModal(null);
      load();
    } catch (e) {
      showToast("error", e.message || "Sale failed");
    } finally {
      setActing(false);
    }
  }

  async function confirmMove(payload) {
    setActing(true);
    try {
      await api.moveStock(token, moveModal._id, payload);
      showToast("success", `Moved ${payload.qty} from ${payload.from} → ${payload.to}`);
      setMoveModal(null);
      load();
    } catch (e) {
      showToast("error", e.message || "Move failed");
    } finally {
      setActing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="lm-shell">
      <Toast toast={toast} />

      {formModal   && <ItemModal   item={formModal.item}   onSave={saveItem}       onClose={() => setFormModal(null)}   saving={saving}   />}
      {sellModal   && <SellModal   item={sellModal}        onConfirm={confirmSale} onClose={() => setSellModal(null)}   saving={acting}   />}
      {moveModal   && <MoveModal   item={moveModal}        onConfirm={confirmMove} onClose={() => setMoveModal(null)}   saving={acting}   />}
      {deleteModal && <DeleteConfirm item={deleteModal}    onConfirm={confirmDelete} onClose={() => setDeleteModal(null)} deleting={deleting} />}
      {importOpen  && <ImportPanel token={token} onDone={() => { setImportOpen(false); load(); }} onClose={() => setImportOpen(false)} />}

      {/* ── Header ── */}
      <div className="lm-header">
        <div className="lm-title-row">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2 className="lm-title">
              Physical Stock
              {stats && <span className="lm-new-pill">{stats.total} SKUs</span>}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="secondary lm-refresh-btn" onClick={() => setImportOpen(true)}>
              📥 Import CSV
            </button>
            <a
              href={`${api.exportStockUrl(token)}`}
              className="secondary lm-refresh-btn"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              download
            >
              📤 Export CSV
            </a>
            <button onClick={() => setFormModal({ item: null })}>
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {stats && (
        <div className="sm-stats-row">
          <StatCard label="Total SKUs"    value={stats.total}        color="#0f172a" onClick={() => filterStatus("")}             active={!statusFilter} />
          <StatCard label="In Stock"      value={stats.in_stock}     color="#059669" onClick={() => filterStatus("in_stock")}     active={statusFilter === "in_stock"} />
          <StatCard label="Low Stock"     value={stats.low_stock}    color="#d97706" onClick={() => filterStatus("low_stock")}    active={statusFilter === "low_stock"} />
          <StatCard label="Out of Stock"  value={stats.out_of_stock} color="#dc2626" onClick={() => filterStatus("out_of_stock")} active={statusFilter === "out_of_stock"} />
          <StatCard label="In Transit"    value={stats.in_transit}   color="#2563eb" onClick={() => filterStatus("in_transit")}   active={statusFilter === "in_transit"} />
          <StatCard label="Unallocated"   value={stats.unallocated}  color="#7c3aed" onClick={() => filterStatus("unallocated")}  active={statusFilter === "unallocated"} />
          <StatCard label="Total Sold"    value={stats.totalSold}    color="#b45309" onClick={() => {}} active={false} />
          <StatCard label="Total Unsold"  value={stats.totalUnsold}  color="#475569" onClick={() => {}} active={false} />
        </div>
      )}

      {/* ── Search ── */}
      <div className="sm-search-row">
        <div className="sm-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="sm-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by shipping mark or description…"
          />
          {search && <button className="sm-search-clear" onClick={() => { setSearch(""); load("", statusFilter); }}>✕</button>}
        </div>
        {statusFilter && (
          <button className="lm-bulk-clear secondary" onClick={() => filterStatus("")} style={{ fontSize: "0.82rem" }}>
            ✕ Clear filter: {STATUS_CFG[statusFilter]?.label}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="lm-loading"><span className="dash-spinner" /><span>Loading stock…</span></div>
      ) : items.length === 0 ? (
        <div className="lm-empty">
          <div className="lm-empty-icon">📦</div>
          <p className="lm-empty-title">{search || statusFilter ? "No items match your filter" : "No stock items yet"}</p>
          <p className="lm-empty-sub">
            {search || statusFilter ? "Try clearing the search or filter." : "Click \"+ Add Item\" or import a CSV to get started."}
          </p>
        </div>
      ) : (
        <div className="sm-table-wrap">
          <table className="sm-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Shipping Mark</th>
                <th>Description</th>
                <th>PKG</th>
                <th>PCS</th>
                <th className="sm-th-green">Sold</th>
                <th>Sold Date</th>
                <th className="sm-th-red">Unsold</th>
                <th>Locations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className={`sm-row sm-row--${item.status}`}>
                  <td className="sm-td-muted">{item.sNo ?? "—"}</td>
                  <td><span className="sm-mark">{item.shippingMark}</span></td>
                  <td className="sm-td-desc">{item.description}</td>
                  <td className="sm-td-num">{item.pkg ?? "—"}</td>
                  <td className="sm-td-num">{item.pcs ?? "—"}</td>
                  <td className="sm-td-sold">{item.soldPcs || 0}</td>
                  <td className="sm-td-muted">{fmtDate(item.soldDate)}</td>
                  <td className={`sm-td-unsold${item.unsold === 0 ? " sm-td-zero" : ""}`}>{item.unsold ?? 0}</td>
                  <td><LocationBar showroom={item.showroomQty} godown={item.godownQty} transit={item.transitQty} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <div className="sm-action-row">
                      <button className="sm-action-btn sm-action-sell" title="Record Sale" onClick={() => setSellModal(item)}>💰</button>
                      <button className="sm-action-btn sm-action-move" title="Move Stock"  onClick={() => setMoveModal(item)}>📦</button>
                      <button className="sm-action-btn sm-action-edit" title="Edit"        onClick={() => setFormModal({ item })}>✏️</button>
                      <button className="sm-action-btn sm-action-del"  title="Delete"      onClick={() => setDeleteModal(item)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
