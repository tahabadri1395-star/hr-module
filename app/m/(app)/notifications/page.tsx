"use client";

import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: number;
  type: "leave" | "attendance" | "murasalat" | "expense" | "travel";
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  leave: "🗓️",
  attendance: "⏰",
  murasalat: "📩",
  expense: "🧾",
  travel: "🧳",
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

export default function MobileNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) setItems((await res.json()).notifications);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: number) {
    setItems(prev => prev.map(n => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  }

  if (loading) return <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />;

  return (
    <div className="space-y-2.5 pb-2">
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No notifications yet.</div>
      ) : (
        items.map(n => (
          <div
            key={n.id}
            onClick={() => !n.read_at && markRead(n.id)}
            className="rounded-2xl bg-white p-4 flex items-start gap-3"
            style={{ boxShadow: "var(--shadow-sm)", backgroundColor: n.read_at ? "white" : "#FAFAFF" }}
          >
            <span className="text-lg shrink-0">{TYPE_ICON[n.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{n.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{n.body}</p>
              <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{fmt(n.created_at)}</p>
            </div>
            {!n.read_at && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#4F46E5" }} />}
          </div>
        ))
      )}
    </div>
  );
}
