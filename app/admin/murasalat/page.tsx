"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Murasalat {
  id: number; title: string; body: string; department: string | null;
  priority: "urgent" | "normal" | "info"; created_by: string; created_at: string;
  read_count: string; total_kgs: string;
}

const P = {
  urgent: { label: "Urgent", bg: "#FEF2F2", color: "#DC2626" },
  normal: { label: "Normal", bg: "#EEF2FF", color: "#4338CA" },
  info:   { label: "Info",   bg: "#F0FDF4", color: "#15803D" },
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      {/* Same dark nav as admin dashboard */}
      <nav className="px-6 h-14 flex items-center justify-between max-w-5xl mx-auto sticky top-0 z-20" style={{ backgroundColor: "#0F172A" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-sm text-white">HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
      </nav>

      <div className="px-6 pb-8 pt-2 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Murasalat</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Send circulars and instructions to Khidmat Guzars</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + New Murasalat
          </button>
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-5xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Compose Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>New Murasalat</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Subject of this circular…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Body *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={5} placeholder="Full text of the instruction or circular…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Department (leave blank = all)</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                    <option value="">All Khidmat Guzars</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Sending…" : "Send Murasalat"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No murasalat sent yet</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Create your first circular above</p>
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
                <div key={m.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        {m.department
                          ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{m.department}</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>All</span>
                        }
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(m.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: readPct === 100 ? "#15803D" : "#B45309" }}>{readPct}%</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{m.read_count}/{m.total_kgs} read</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 ml-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Read progress bar */}
                  <div className="px-5 pb-3 -mt-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${readPct}%`, backgroundColor: readPct === 100 ? "#15803D" : "#F59E0B" }}></div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "#F8FAFC" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "#334155" }}>{m.body}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>Sent by {m.created_by}</p>
                        <button onClick={() => remove(m.id, m.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
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
