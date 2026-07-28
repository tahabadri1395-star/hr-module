"use client";

import { useState, useEffect, useCallback } from "react";

interface Murasalat {
  id: number;
  title: string;
  body: string;
  priority: "urgent" | "normal" | "info";
  created_at: string;
  is_read: boolean;
}

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export default function MobileMurasalatPage() {
  const [items, setItems] = useState<Murasalat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/murasalat");
    if (res.ok) setItems((await res.json()).murasalat);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: number) {
    await fetch(`/api/murasalat/${id}`, { method: "POST" });
    setItems(prev => prev.map(m => (m.id === id ? { ...m, is_read: true } : m)));
  }

  if (loading) return <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />;

  return (
    <div className="space-y-2.5 pb-2">
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No circulars yet.</div>
      ) : (
        items.map(m => (
          <div
            key={m.id}
            onClick={() => !m.is_read && markRead(m.id)}
            className="rounded-2xl bg-white p-4"
            style={{ boxShadow: "var(--shadow-sm)", backgroundColor: m.is_read ? "white" : "#FAFAFF" }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Urgent</span>}
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
              </div>
              {!m.is_read && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#4F46E5" }} />}
            </div>
            <p className="text-xs mt-1" style={{ color: "#64748B" }}>{m.body}</p>
            <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>{fmt(m.created_at)}</p>
          </div>
        ))
      )}
    </div>
  );
}
