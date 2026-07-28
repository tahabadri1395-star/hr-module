"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const MODULES = [
  { key: "leave", label: "Leave", color: "#4F46E5", bg: "#EEF2FF", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke="#4F46E5" strokeWidth="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { key: "travel", label: "Travel & Expenses", color: "#0891B2", bg: "#ECFEFF", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="2" stroke="#0891B2" strokeWidth="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#0891B2" strokeWidth="2"/></svg>
  ) },
  { key: "murasalat", label: "Murasalat", color: "#7C3AED", bg: "#F5F3FF", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M4 5h16v14H4z" stroke="#7C3AED" strokeWidth="2"/><path d="m4 6 8 7 8-7" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { key: "arz", label: "Arz", color: "#B45309", bg: "#FFFBEB", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z" stroke="#B45309" strokeWidth="2" strokeLinejoin="round"/></svg>
  ) },
  { key: "profile", label: "Profile", color: "#15803D", bg: "#F0FDF4", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" stroke="#15803D" strokeWidth="2"/><path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6" stroke="#15803D" strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { key: "notifications", label: "Notifications", color: "#DC2626", bg: "#FEF2F2", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) },
];

export default function ModuleGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {MODULES.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href={`/m/${m.key}`}>
            <motion.div
              whileTap={{ scale: 0.94 }}
              className="rounded-2xl bg-white flex flex-col items-center justify-center gap-2 py-4 text-center"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                {m.icon}
              </div>
              <span className="text-[11px] font-medium leading-tight px-1" style={{ color: "#475569" }}>{m.label}</span>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
