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
          style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.06)" }}
        >
          <p className="text-2xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: "#94A3B8" }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
