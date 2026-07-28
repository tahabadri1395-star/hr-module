"use client";

import { motion } from "framer-motion";

interface Stat {
  label: string;
  value: number;
  color: string;
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
          className="rounded-2xl bg-white px-4 py-3.5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
