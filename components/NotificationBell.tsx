"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

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

function timeAgo(d: string) {
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "POST" });
  }

  async function markOneRead(id: number) {
    setNotifications(prev => prev.map(n => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-semibold flex items-center justify-center"
            style={{ backgroundColor: "#DC2626" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white overflow-hidden z-50"
          style={{ boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12))" }}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#F1F5F9" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium" style={{ color: "#4F46E5" }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No notifications yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {notifications.map(n => {
                  const content = (
                    <div
                      className="px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50"
                      style={{ backgroundColor: n.read_at ? "transparent" : "#F5F3FF" }}
                    >
                      <span className="text-base shrink-0">{TYPE_ICON[n.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{n.title}</p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>{n.body}</p>
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read_at && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#4F46E5" }} />}
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => markOneRead(n.id)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => markOneRead(n.id)} className="cursor-pointer">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
