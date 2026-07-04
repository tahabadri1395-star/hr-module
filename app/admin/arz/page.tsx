"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Arz {
  id: number; employee_name: string; department: string | null; employee_code: string | null;
  category: string; subject: string; body: string;
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
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <nav className="px-6 h-14 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-sm text-white">HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
      </nav>

      <div className="px-6 pb-6 pt-2 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Personal Arz</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Review and respond to Khidmat Guzar requests</p>
          </div>
          <div className="flex gap-3">
            {urgentCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "#7F1D1D", color: "#FCA5A5" }}>
                {urgentCount} urgent
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}>
              {openCount} active
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-5xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>
        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          {([["open", `Active${openCount > 0 ? ` (${openCount})` : ""}`], ["resolved", "Resolved"], ["all", "All"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-sm py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? "#0F172A" : "transparent", color: filter === f ? "white" : "#64748B" }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No {filter !== "all" ? filter : ""} submissions</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>All clear</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const p = PRI[item.priority];
              const s = STA[item.status];
              const isOpen = expanded === item.id;
              const isResponding = responding === item.id;
              return (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => { setExpanded(isOpen ? null : item.id); setResponding(null); }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CAT[item.category]}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{item.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                        {item.employee_name}{item.department ? ` · ${item.department}` : ""} · {fmt(item.created_at)}
                      </p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "#F8FAFC" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "#334155" }}>{item.body}</p>

                      {/* Existing response */}
                      {item.admin_response && !isResponding && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#15803D" }}>Your response ({item.responded_by})</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "#166534" }}>{item.admin_response}</p>
                        </div>
                      )}

                      {/* Respond form */}
                      {isResponding ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Response</label>
                            <textarea value={response} onChange={e => setResponse(e.target.value)}
                              rows={4} placeholder="Write your response…"
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none"
                              style={{ borderColor: "#F59E0B", color: "#1E293B" }} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Update Status</label>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respond(item.id)} disabled={saving}
                              className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
                              style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                              {saving ? "Saving…" : "Save Response"}
                            </button>
                            <button onClick={() => setResponding(null)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-4">
                          <button onClick={e => { e.stopPropagation(); setResponding(item.id); setResponse(item.admin_response ?? ""); setNewStatus(item.status === "open" ? "in_progress" : item.status); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-black"
                            style={{ backgroundColor: "#F59E0B" }}>
                            {item.admin_response ? "Edit Response" : "Respond"}
                          </button>
                          {item.status !== "resolved" && item.status !== "closed" && (
                            <button onClick={e => { e.stopPropagation(); updateStatus(item.id, "resolved"); }}
                              className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#BBF7D0", color: "#16A34A", backgroundColor: "#F0FDF4" }}>
                              Mark Resolved
                            </button>
                          )}
                          {item.status !== "closed" && (
                            <button onClick={e => { e.stopPropagation(); updateStatus(item.id, "closed"); }}
                              className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
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
