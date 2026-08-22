"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { bg, accent, muted } from "@/lib/mobile-theme";

const TABS = [
  { key: "dashboard", label: "Home", icon: (c: string) => (
    <svg width="23" height="23" fill="none" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V21h14V9.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { key: "attendance", label: "Attendance", icon: (c: string) => (
    <svg width="23" height="23" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2"/><path d="M12 7v5l3.5 2" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
  { key: "leave", label: "Leave", icon: (c: string) => (
    <svg width="23" height="23" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { key: "travel", label: "Travel", icon: (c: string) => (
    <svg width="23" height="23" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="2" stroke={c} strokeWidth="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={c} strokeWidth="2"/></svg>
  ) },
  { key: "more", label: "More", icon: (c: string) => (
    <svg width="23" height="23" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill={c}/><circle cx="12" cy="12" r="1.8" fill={c}/><circle cx="19" cy="12" r="1.8" fill={c}/></svg>
  ) },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-3"
      style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom) + 10px), 14px)" }}
    >
      <nav
        className="flex items-stretch w-full max-w-md rounded-[28px] px-1.5 py-1.5"
        style={{
          backgroundColor: "rgba(238,240,243,0.88)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 24px rgba(30,35,50,0.14), 0 2px 6px rgba(30,35,50,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {TABS.map(tab => {
          const href = `/m/${tab.key}`;
          const active = tab.key === "dashboard" ? pathname === href : pathname.startsWith(href);
          const color = active ? accent : muted;
          return (
            <Link key={tab.key} href={href} className="flex-1 flex items-center justify-center py-1">
              <motion.div
                animate={{ scale: active ? 1 : 1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="w-full flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl"
                style={active ? { backgroundColor: bg, boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.07), inset -2px -2px 5px rgba(255,255,255,0.8)" } : {}}
              >
                {tab.icon(color)}
                <span className="text-[10px]" style={{ color, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
