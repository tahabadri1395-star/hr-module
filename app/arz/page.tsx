"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Arz {
  id: number; category: string; subject: string; body: string;
  priority: "urgent" | "normal" | "info"; status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null; responded_by: string | null; responded_at: string | null;
  created_at: string;
}

const CAT: Record<string, string> = { personal: "Personal", professional: "Professional", grievance: "Grievance", request: "Request" };
const PRI = { urgent: { label: "Urgent", bg: "#FEF2F2", color: "#DC2626" }, normal: { label: "Normal", bg: "#EEF2FF", color: "#4338CA" }, info: { label: "Info", bg: "#F0FDF4", color: "#15803D" } };
const STA = {
  open:        { label: "Open",        bg: "#FFF7ED", color: "#EA580C" },
  in_progress: { label: "In Progress", bg: "#EFF6FF", color: "#2563EB" },
  resolved:    { label: "Resolved",    bg: "#F0FDF4", color: "#16A34A" },
  closed:      { label: "Closed",      bg: "#F8FAFC", color: "#64748B" },
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Personal Arz</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Submit requests or grievances to administration</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            + New Arz
          </button>
        </div>

        {/* New Arz Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #7C3AED" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>Submit New Arz</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                    <option value="personal">Personal</option>
                    <option value="professional">Professional</option>
                    <option value="grievance">Grievance</option>
                    <option value="request">Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief subject of your arz…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#7C3AED")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Details *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={5} placeholder="Explain your request in detail…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#7C3AED")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Arz"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
          {([["all", "All"], ["open", `Active${openCount > 0 ? ` (${openCount})` : ""}`], ["resolved", "Resolved"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-sm py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? "#4F46E5" : "transparent", color: filter === f ? "white" : "#64748B" }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No submissions yet</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Use the button above to submit your first arz</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const p = PRI[item.priority];
              const s = STA[item.status];
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  onClick={() => setExpanded(isOpen ? null : item.id)}>
                  <div className="px-5 py-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CAT[item.category]}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{item.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(item.created_at)}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "#F1F5F9" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "#334155" }}>{item.body}</p>
                      {item.admin_response && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#15803D" }}>Response from {item.responded_by}</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "#166534" }}>{item.admin_response}</p>
                          {item.responded_at && <p className="text-xs mt-2" style={{ color: "#86EFAC" }}>{fmt(item.responded_at)}</p>}
                        </div>
                      )}
                      {!item.admin_response && (
                        <p className="text-xs mt-3" style={{ color: "#94A3B8" }}>Awaiting response from administration</p>
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
