"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Open",        bg: "#FEF2F2", color: "#DC2626" },
  in_progress: { label: "In Progress", bg: "#FFFBEB", color: "#B45309" },
  resolved:    { label: "Resolved",    bg: "#F0FDF4", color: "#15803D" },
  closed:      { label: "Closed",      bg: "#F1F5F9", color: "#64748B" },
};

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
        className="w-full py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
      >
        + New Arz
      </motion.button>

      {loading ? (
        <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No arz submitted yet.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map(a => {
            const sm = STATUS_META[a.status] ?? STATUS_META.open;
            return (
              <div key={a.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{a.category}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{a.subject}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{a.body}</p>
                {a.admin_response && (
                  <div className="mt-2 p-2.5 rounded-xl text-xs" style={{ backgroundColor: "#F8FAFC" }}>
                    <span className="font-semibold" style={{ color: "#1E293B" }}>Response: </span>
                    <span style={{ color: "#64748B" }}>{a.admin_response}</span>
                  </div>
                )}
                <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{fmt(a.created_at)}</p>
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5"
              style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E2E8F0" }} />
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>New Arz</h2>
              <form onSubmit={submit} className="space-y-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm border" style={{ borderColor: "#E2E8F0" }}>
                  <option value="personal">Personal</option>
                  <option value="professional">Professional</option>
                  <option value="grievance">Grievance</option>
                  <option value="request">Request</option>
                </select>
                <input required placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm border" style={{ borderColor: "#E2E8F0" }} />
                <textarea required placeholder="Describe your request" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none" style={{ borderColor: "#E2E8F0" }} />
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm border" style={{ borderColor: "#E2E8F0" }}>
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                {error && <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{error}</div>}
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: submitting ? 0.7 : 1 }}>
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
