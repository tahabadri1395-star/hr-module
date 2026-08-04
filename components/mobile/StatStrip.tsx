"use client";

import { motion } from "framer-motion";
import { bg, muted, accent, neuRaised } from "@/lib/mobile-theme";

interface Stat {
  label: string;
  value: number;
}

export default function StatStrip({ items }: { items: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl px-4 py-3.5"
          style={{ backgroundColor: bg, boxShadow: neuRaised }}
        >
          <p className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{s.value}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: muted }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
