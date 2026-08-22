"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Murasalat {
  id: number; title: string; body: string; department: string | null;
  priority: "urgent" | "normal" | "info"; created_by: string; created_at: string; is_read: boolean;
}

const P = {
  urgent: { label: "Urgent", bg: "rgba(248,113,113,0.15)", color: "#F87171", border: "rgba(248,113,113,0.35)" },
  normal: { label: "Normal", bg: "rgba(167,139,250,0.15)", color: "#A78BFA", border: "rgba(167,139,250,0.35)" },
  info:   { label: "Info",   bg: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "rgba(74,222,128,0.35)" },
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: ink }}>Murasalat</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Circulars and instructions from administration</p>
          </div>
          {unreadCount > 0 && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(167,139,250,0.2)", color: "#A78BFA" }}>
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={glassPill}>
          {(["all", "unread", "read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: filter === f ? gold : "transparent", color: filter === f ? "#1B1630" : muted }}>
              {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No {filter !== "all" ? filter : ""} murasalat</p>
            <p className="text-xs mt-1" style={{ color: muted }}>Check back later for new circulars</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const p = P[m.priority];
              const isOpen = expanded === m.id;
              return (
                <div key={m.id} className="rounded-2xl overflow-hidden cursor-pointer transition"
                  style={{ ...glassCard, border: `1px solid ${m.is_read ? "rgba(255,255,255,0.1)" : p.border}`, opacity: m.is_read ? 0.85 : 1 }}
                  onClick={() => expand(m)}>
                  <div className="px-5 py-4 flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      {!m.is_read
                        ? <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#A78BFA" }}></div>
                        : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                        {m.department && <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{m.department}</span>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>{fmt(m.created_at)}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 transition-transform"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.85)" }}>{m.body}</p>
                      {m.is_read && (
                        <p className="text-xs mt-3" style={{ color: mutedFaint }}>Read</p>
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
