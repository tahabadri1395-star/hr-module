"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Murasalat {
  id: number; title: string; body: string; department: string | null;
  priority: "urgent" | "normal" | "info"; created_by: string; created_at: string; is_read: boolean;
}

const P = {
  urgent: { label: "Urgent", bg: "#FEF2F2", color: "#DC2626", border: "#FECDD3" },
  normal: { label: "Normal", bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  info:   { label: "Info",   bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function MurasalatPage() {
  const [items, setItems] = useState<Murasalat[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/murasalat");
    if (res.ok) { const d = await res.json(); setItems(d.murasalat); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: number) {
    await fetch(`/api/murasalat/${id}`, { method: "POST" });
    setItems(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  }

  async function expand(m: Murasalat) {
    setExpanded(expanded === m.id ? null : m.id);
    if (!m.is_read) await markRead(m.id);
  }

  const filtered = items.filter(m =>
    filter === "all" ? true : filter === "unread" ? !m.is_read : m.is_read
  );
  const unreadCount = items.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70 hover:text-white">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Murasalat</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Circulars and instructions from administration</p>
          </div>
          {unreadCount > 0 && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "#7C3AED", color: "white" }}>
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
          {(["all", "unread", "read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: filter === f ? "#4F46E5" : "transparent", color: filter === f ? "white" : "#64748B" }}>
              {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No {filter !== "all" ? filter : ""} murasalat</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Check back later for new circulars</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const p = P[m.priority];
              const isOpen = expanded === m.id;
              return (
                <div key={m.id} className="bg-white rounded-2xl overflow-hidden cursor-pointer transition hover:shadow-md"
                  style={{ border: `1px solid ${m.is_read ? "#E2E8F0" : p.border}`, opacity: m.is_read ? 0.85 : 1 }}
                  onClick={() => expand(m)}>
                  <div className="px-5 py-4 flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      {!m.is_read
                        ? <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7C3AED" }}></div>
                        : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E2E8F0" }}></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        {m.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{m.department}</span>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(m.created_at)}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 transition-transform"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "#F1F5F9" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "#334155" }}>{m.body}</p>
                      {m.is_read && (
                        <p className="text-xs mt-3" style={{ color: "#94A3B8" }}>Read</p>
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
