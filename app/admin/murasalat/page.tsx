"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Murasalat {
  id: number; title: string; body: string; department: string | null;
  priority: "urgent" | "normal" | "info"; created_by: string; created_at: string;
  read_count: string; total_kgs: string;
}

const P = {
  urgent: { label: "Urgent", bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  normal: { label: "Normal", bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  info:   { label: "Info",   bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminMurasalatPage() {
  const [items, setItems] = useState<Murasalat[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", body: "", department: "", priority: "normal" });
  const [departments, setDepartments] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/murasalat");
    if (res.ok) { const d = await res.json(); setItems(d.murasalat); }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/employees").then(r => r.json()).then(d => {
      const depts = [...new Set((d.employees ?? []).map((e: { department: string | null }) => e.department).filter(Boolean))] as string[];
      setDepartments(depts);
    });
  }, [load]);

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setMsg("Title and body are required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/murasalat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, department: form.department || null }),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ title: "", body: "", department: "", priority: "normal" }); load(); }
    else setMsg("Failed to send.");
  }

  async function remove(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/murasalat/${id}`, { method: "DELETE" });
    load();
  }

  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.06)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: "#F59E0B" }}>
            <img src="/estate-mark.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Murasalat</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Send circulars and instructions to Khidmat Guzars</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + New Murasalat
          </button>
        </div>

        {/* Compose Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-5" style={{ ...glassCard, border: "1px solid rgba(217,180,108,0.4)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: ink }}>New Murasalat</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Subject of this circular…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Body *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={5} placeholder="Full text of the instruction or circular…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none glass-input"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Department (leave blank = all)</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                    <option value="">All Khidmat Guzars</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Sending…" : "Send Murasalat"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        {items.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No murasalat sent yet</p>
            <p className="text-xs mt-1" style={{ color: mutedFaint }}>Create your first circular above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(m => {
              const p = P[m.priority];
              const readPct = parseInt(m.total_kgs, 10) > 0
                ? Math.round((parseInt(m.read_count, 10) / parseInt(m.total_kgs, 10)) * 100)
                : 0;
              const isOpen = expanded === m.id;
              return (
                <div key={m.id} className="rounded-2xl overflow-hidden" style={glassCard}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{m.department || "All"}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>{fmt(m.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: readPct === 100 ? "#4ADE80" : "#D9B46C" }}>{readPct}%</p>
                      <p className="text-xs" style={{ color: mutedFaint }}>{m.read_count}/{m.total_kgs} read</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 ml-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Read progress bar */}
                  <div className="px-5 pb-3 -mt-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${readPct}%`, backgroundColor: readPct === 100 ? "#4ADE80" : gold }}></div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: muted }}>{m.body}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <p className="text-xs" style={{ color: mutedFaint }}>Sent by {m.created_by}</p>
                        <button onClick={() => remove(m.id, m.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>
                          Delete
                        </button>
                      </div>
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
