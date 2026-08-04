"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { bg, ink, muted, neuRaised, neuInset } from "@/lib/mobile-theme";

const ITEMS = [
  { key: "murasalat", label: "Murasalat", desc: "Circulars & announcements", color: "#7C3AED" },
  { key: "arz", label: "Arz", desc: "Personal requests to admin", color: "#B45309" },
  { key: "profile", label: "Profile", desc: "Your details & documents", color: "#15803D" },
  { key: "notifications", label: "Notifications", desc: "All updates in one place", color: "#DC2626" },
  { key: "documents", label: "Documents", desc: "Policies & forms", color: "#1D4ED8" },
  { key: "assets", label: "My Assets", desc: "Equipment assigned to you", color: "#4F46E5" },
];

export default function MobileMorePage() {
  return (
    <div className="space-y-2.5 pb-2">
      {ITEMS.map((item, i) => (
        <motion.div key={item.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
          <Link href={`/m/${item.key}`}>
            <motion.div whileTap={{ scale: 0.98 }} className="rounded-3xl p-4 flex items-center gap-3.5" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg, boxShadow: neuInset, color: item.color }}>
                <span className="text-lg font-bold">{item.label.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: ink }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: muted }}>{item.desc}</p>
              </div>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
