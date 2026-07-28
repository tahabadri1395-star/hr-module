"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { key: "dashboard", label: "Home", icon: (c: string) => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V21h14V9.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { key: "attendance", label: "Attendance", icon: (c: string) => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2"/><path d="M12 7v5l3.5 2" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { key: "leave", label: "Leave", icon: (c: string) => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { key: "travel", label: "Travel", icon: (c: string) => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="2" stroke={c} strokeWidth="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={c} strokeWidth="2"/></svg>
  ) },
  { key: "more", label: "More", icon: (c: string) => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill={c}/><circle cx="12" cy="12" r="1.8" fill={c}/><circle cx="19" cy="12" r="1.8" fill={c}/></svg>
  ) },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid #EEF0F4",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(tab => {
        const href = `/m/${tab.key}`;
        const active = tab.key === "dashboard" ? pathname === href : pathname.startsWith(href);
        const color = active ? "#4F46E5" : "#94A3B8";
        return (
          <Link key={tab.key} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative">
            {active && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: "#4F46E5" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <motion.div animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              {tab.icon(color)}
            </motion.div>
            <span className="text-[10px] font-medium" style={{ color }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
