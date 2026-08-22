"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Arz {
  id: number; category: string; subject: string; body: string;
  priority: "urgent" | "normal" | "info"; status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null; responded_by: string | null; responded_at: string | null;
  created_at: string;
}

const CAT: Record<string, string> = { personal: "Personal", professional: "Professional", grievance: "Grievance", request: "Request" };
const PRI = { urgent: { label: "Urgent", bg: "rgba(248,113,113,0.15)", color: "#F87171" }, normal: { label: "Normal", bg: "rgba(167,139,250,0.15)", color: "#A78BFA" }, info: { label: "Info", bg: "rgba(74,222,128,0.15)", color: "#4ADE80" } };
const STA = {
  open:        { label: "Open",        bg: "rgba(251,146,60,0.15)", color: "#FB923C" },
  in_progress: { label: "In Progress", bg: "rgba(96,165,250,0.15)", color: "#60A5FA" },
  resolved:    { label: "Resolved",    bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  closed:      { label: "Closed",      bg: "rgba(255,255,255,0.08)", color: muted },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function ArzPage() {
  const [items, setItems] = useState<Arz[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [form, setForm] = useState({ category: "personal", subject: "", body: "", priority: "normal" });

  const load = useCallback(async () => {
    const res = await fetch("/api/arz");
    if (res.ok) { const d = await res.json(); setItems(d.arz); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!form.subject.trim() || !form.body.trim()) { setMsg("Subject and body are required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/arz", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ category: "personal", subject: "", body: "", priority: "normal" }); load(); }
    else { const d = await res.json(); setMsg(d.error || "Failed to submit."); }
  }

  const filtered = items.filter(i =>
    filter === "all" ? true : filter === "open" ? ["open","in_progress"].includes(i.status) : ["resolved","closed"].includes(i.status)
  );
  const openCount = items.filter(i => ["open","in_progress"].includes(i.status)).length;

  const selectStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: ink }}>Personal Arz</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Submit requests or grievances to administration</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + New Arz
          </button>
        </div>

        {/* New Arz Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-5" style={{ ...glassCard, border: `2px solid ${gold}` }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: ink }}>Submit New Arz</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={selectStyle}>
                    <option value="personal" style={{ color: "#1E293B" }}>Personal</option>
                    <option value="professional" style={{ color: "#1E293B" }}>Professional</option>
                    <option value="grievance" style={{ color: "#1E293B" }}>Grievance</option>
                    <option value="request" style={{ color: "#1E293B" }}>Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={selectStyle}>
                    <option value="urgent" style={{ color: "#1E293B" }}>Urgent</option>
                    <option value="normal" style={{ color: "#1E293B" }}>Normal</option>
                    <option value="info" style={{ color: "#1E293B" }}>Info</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief subject of your arz…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input"
                  style={selectStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Details *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={5} placeholder="Explain your request in detail…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none glass-input"
                  style={selectStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Arz"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={glassPill}>
          {([["all", "All"], ["open", `Active${openCount > 0 ? ` (${openCount})` : ""}`], ["resolved", "Resolved"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-sm py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? gold : "transparent", color: filter === f ? "#1B1630" : muted }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No submissions yet</p>
            <p className="text-xs mt-1" style={{ color: muted }}>Use the button above to submit your first arz</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const p = PRI[item.priority];
              const s = STA[item.status];
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="rounded-2xl overflow-hidden cursor-pointer"
                  style={glassCard}
                  onClick={() => setExpanded(isOpen ? null : item.id)}>
                  <div className="px-5 py-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{CAT[item.category]}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{item.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>{fmt(item.created_at)}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.85)" }}>{item.body}</p>
                      {item.admin_response && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#4ADE80" }}>Response from {item.responded_by}</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.85)" }}>{item.admin_response}</p>
                          {item.responded_at && <p className="text-xs mt-2" style={{ color: "rgba(74,222,128,0.6)" }}>{fmt(item.responded_at)}</p>}
                        </div>
                      )}
                      {!item.admin_response && (
                        <p className="text-xs mt-3" style={{ color: mutedFaint }}>Awaiting response from administration</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
