"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { bg, ink, muted, accent, neuRaised, neuInset } from "@/lib/mobile-theme";

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

  if (loading) return <div className="rounded-3xl h-40" style={{ backgroundColor: bg, boxShadow: neuInset }} />;

  return (
    <div className="space-y-2.5 pb-2">
      {items.length === 0 ? (
        <div className="rounded-3xl py-12 text-center text-sm" style={{ backgroundColor: bg, boxShadow: neuRaised, color: muted }}>No notifications yet.</div>
      ) : (
        items.map(n => (
          <motion.div
            key={n.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => !n.read_at && markRead(n.id)}
            className="rounded-3xl p-4 flex items-start gap-3"
            style={{ backgroundColor: bg, boxShadow: n.read_at ? neuRaised : neuInset }}
          >
            <span className="text-lg shrink-0">{TYPE_ICON[n.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: ink }}>{n.title}</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>{n.body}</p>
              <p className="text-xs mt-1.5" style={{ color: muted }}>{fmt(n.created_at)}</p>
            </div>
            {!n.read_at && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: accent }} />}
          </motion.div>
        ))
      )}
    </div>
  );
}
