"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ITEMS = [
  { key: "murasalat", label: "Murasalat", desc: "Circulars & announcements", color: "#7C3AED", bg: "#F5F3FF" },
  { key: "arz", label: "Arz", desc: "Personal requests to admin", color: "#B45309", bg: "#FFFBEB" },
  { key: "profile", label: "Profile", desc: "Your details & documents", color: "#15803D", bg: "#F0FDF4" },
  { key: "notifications", label: "Notifications", desc: "All updates in one place", color: "#DC2626", bg: "#FEF2F2" },
  { key: "documents", label: "Documents", desc: "Policies & forms", color: "#1D4ED8", bg: "#EFF6FF" },
  { key: "assets", label: "My Assets", desc: "Equipment assigned to you", color: "#4F46E5", bg: "#EEF2FF" },
];

export default function MobileMorePage() {
  return (
    <div className="space-y-2.5 pb-2">
      {ITEMS.map((item, i) => (
        <motion.div key={item.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
          <Link href={`/m/${item.key}`}>
            <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl bg-white p-4 flex items-center gap-3.5" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                <span className="text-lg font-bold">{item.label.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{item.desc}</p>
              </div>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
