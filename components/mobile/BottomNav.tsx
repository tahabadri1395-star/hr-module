"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { bg, accent, muted, neuInset } from "@/lib/mobile-theme";

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
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch pt-2.5"
      style={{
        backgroundColor: bg,
        boxShadow: "0 -6px 16px rgba(0,0,0,0.05)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(tab => {
        const href = `/m/${tab.key}`;
        const active = tab.key === "dashboard" ? pathname === href : pathname.startsWith(href);
        const color = active ? accent : muted;
        return (
          <Link key={tab.key} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 relative">
            <motion.div
              animate={{ scale: active ? 1.06 : 1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={active ? { boxShadow: neuInset } : {}}
            >
              {tab.icon(color)}
            </motion.div>
            <span className="text-[10px]" style={{ color, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
