"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bg, ink, muted, neuRaised, neuInset, accentGradient, accentShadow } from "@/lib/mobile-theme";

interface Arz {
  id: number;
  category: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  admin_response: string | null;
  responded_by: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  open:        { label: "Open",        color: "#DC2626" },
  in_progress: { label: "In Progress", color: "#B45309" },
  resolved:    { label: "Resolved",    color: "#15803D" },
  closed:      { label: "Closed",      color: "#6B7280" },
};

const inputStyle = { backgroundColor: bg, boxShadow: neuInset, color: ink };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export default function MobileArzPage() {
  const [items, setItems] = useState<Arz[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "personal", subject: "", body: "", priority: "normal" });

  const load = useCallback(async () => {
    const res = await fetch("/api/arz");
    if (res.ok) setItems((await res.json()).arz);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/arz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit.");
      setSheetOpen(false);
      setForm({ category: "personal", subject: "", body: "", priority: "normal" });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4 pb-2">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setSheetOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: accentGradient, boxShadow: accentShadow }}
      >
        + New Arz
      </motion.button>

      {loading ? (
        <div className="rounded-3xl h-40" style={{ backgroundColor: bg, boxShadow: neuInset }} />
      ) : items.length === 0 ? (
        <div className="rounded-3xl py-12 text-center text-sm" style={{ color: muted, backgroundColor: bg, boxShadow: neuRaised }}>No arz submitted yet.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map(a => {
            const sm = STATUS_META[a.status] ?? STATUS_META.open;
            return (
              <div key={a.id} className="rounded-3xl p-4" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: bg, boxShadow: neuInset, color: "#6B7280" }}>{a.category}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: bg, boxShadow: neuInset, color: sm.color }}>{sm.label}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: ink }}>{a.subject}</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{a.body}</p>
                {a.admin_response && (
                  <div className="mt-2 p-2.5 rounded-xl text-xs" style={{ backgroundColor: bg, boxShadow: neuInset }}>
                    <span className="font-bold" style={{ color: ink }}>Response: </span>
                    <span style={{ color: "#6B7280" }}>{a.admin_response}</span>
                  </div>
                )}
                <p className="text-xs mt-1.5" style={{ color: muted }}>{fmt(a.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(15,23,42,0.5)" }} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5"
              style={{ backgroundColor: bg, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#D1D4D9" }} />
              <h2 className="text-base font-bold mb-4" style={{ color: ink }}>New Arz</h2>
              <form onSubmit={submit} className="space-y-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="personal">Personal</option>
                  <option value="professional">Professional</option>
                  <option value="grievance">Grievance</option>
                  <option value="request">Request</option>
                </select>
                <input required placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                <textarea required placeholder="Describe your request" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                {error && <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: bg, boxShadow: neuInset, color: "#DC2626" }}>{error}</div>}
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: accentGradient, boxShadow: accentShadow, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Submitting…" : "Submit Arz"}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
