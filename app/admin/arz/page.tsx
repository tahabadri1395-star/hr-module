"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Arz {
  id: number; employee_name: string; department: string | null; employee_code: string | null;
  category: string; subject: string; body: string;
  priority: "urgent" | "normal" | "info"; status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null; responded_by: string | null; responded_at: string | null;
  created_at: string;
}

const CAT: Record<string, string> = { personal: "Personal", professional: "Professional", grievance: "Grievance", request: "Request" };
const PRI = {
  urgent: { label: "Urgent", bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  normal: { label: "Normal", bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  info:   { label: "Info",   bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
};
const STA = {
  open:        { label: "Open",        bg: "rgba(251,146,60,0.15)", color: "#FB923C" },
  in_progress: { label: "In Progress", bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  resolved:    { label: "Resolved",    bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  closed:      { label: "Closed",      bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminArzPage() {
  const [items, setItems] = useState<Arz[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [responding, setResponding] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("in_progress");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/arz");
    if (res.ok) { const d = await res.json(); setItems(d.arz); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(id: number) {
    setSaving(true);
    await fetch(`/api/admin/arz/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, admin_response: response || null }),
    });
    setSaving(false);
    setResponding(null); setResponse(""); setNewStatus("in_progress");
    load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/arz/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const filtered = items.filter(i =>
    filter === "all" ? true : filter === "open" ? ["open","in_progress"].includes(i.status) : ["resolved","closed"].includes(i.status)
  );
  const openCount = items.filter(i => ["open","in_progress"].includes(i.status)).length;
  const urgentCount = items.filter(i => i.priority === "urgent" && ["open","in_progress"].includes(i.status)).length;

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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Personal Arz</h1>
            <p className="text-sm mt-1" style={{ color: muted }}>Review and respond to Khidmat Guzar requests</p>
          </div>
          <div className="flex gap-3">
            {urgentCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>
                {urgentCount} urgent
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={glassPill}>
              {openCount} active
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={glassPill}>
          {([["open", `Active${openCount > 0 ? ` (${openCount})` : ""}`], ["resolved", "Resolved"], ["all", "All"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-sm py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? gold : "transparent", color: filter === f ? "#1B1630" : muted }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No {filter !== "all" ? filter : ""} submissions</p>
            <p className="text-xs mt-1" style={{ color: mutedFaint }}>All clear</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const p = PRI[item.priority];
              const s = STA[item.status];
              const isOpen = expanded === item.id;
              const isResponding = responding === item.id;
              return (
                <div key={item.id} className="rounded-2xl overflow-hidden" style={glassCard}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => { setExpanded(isOpen ? null : item.id); setResponding(null); }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{CAT[item.category]}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{item.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>
                        {item.employee_name}{item.department ? ` · ${item.department}` : ""} · {fmt(item.created_at)}
                      </p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: muted }}>{item.body}</p>

                      {/* Existing response */}
                      {item.admin_response && !isResponding && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#4ADE80" }}>Your response ({item.responded_by})</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: ink }}>{item.admin_response}</p>
                        </div>
                      )}

                      {/* Respond form */}
                      {isResponding ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Response</label>
                            <textarea value={response} onChange={e => setResponse(e.target.value)}
                              rows={4} placeholder="Write your response…"
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none glass-input"
                              style={{ borderColor: gold, backgroundColor: "rgba(255,255,255,0.05)", color: ink }} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Update Status</label>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink }}>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respond(item.id)} disabled={saving}
                              className="text-sm font-semibold px-4 py-2 rounded-xl"
                              style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                              {saving ? "Saving…" : "Save Response"}
                            </button>
                            <button onClick={() => setResponding(null)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-4">
                          <button onClick={e => { e.stopPropagation(); setResponding(item.id); setResponse(item.admin_response ?? ""); setNewStatus(item.status === "open" ? "in_progress" : item.status); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: gold, color: "#1B1630" }}>
                            {item.admin_response ? "Edit Response" : "Respond"}
                          </button>
                          {item.status !== "resolved" && item.status !== "closed" && (
                            <button onClick={e => { e.stopPropagation(); updateStatus(item.id, "resolved"); }}
                              className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ADE80", backgroundColor: "rgba(74,222,128,0.1)" }}>
                              Mark Resolved
                            </button>
                          )}
                          {item.status !== "closed" && (
                            <button onClick={e => { e.stopPropagation(); updateStatus(item.id, "closed"); }}
                              className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                              Close
                            </button>
                          )}
                        </div>
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
