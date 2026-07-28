"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaveApp {
  id: number;
  leave_type: "emergency" | "normal";
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period: string | null;
  reason: string;
  status: string;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "Pending",         bg: "#FFFBEB", color: "#B45309" },
  admin_approved:       { label: "Admin Approved",   bg: "#EFF6FF", color: "#1D4ED8" },
  approved:             { label: "Approved",         bg: "#F0FDF4", color: "#15803D" },
  admin_rejected:       { label: "Rejected",         bg: "#FEF2F2", color: "#DC2626" },
  super_admin_rejected: { label: "Rejected",         bg: "#FEF2F2", color: "#DC2626" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export default function MobileLeavePage() {
  const [leaves, setLeaves] = useState<LeaveApp[]>([]);
  const [emergency, setEmergency] = useState({ used: 0, remaining: 7 });
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: "normal", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/leave/my-leaves");
    if (res.ok) {
      const d = await res.json();
      setLeaves(d.leaves);
      setEmergency({ used: d.emergency_used, remaining: d.emergency_remaining });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit.");
      setSheetOpen(false);
      setForm({ leave_type: "normal", start_date: "", end_date: "", reason: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id: number) {
    await fetch(`/api/leave/${id}/cancel`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-2xl bg-white px-4 py-3.5 flex items-center justify-between" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Emergency leave used this year</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "#1E293B" }}>{emergency.used} / 7</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSheetOpen(true)}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
        >
          + Apply
        </motion.button>
      </div>

      {loading ? (
        <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />
      ) : leaves.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No leave applications yet.</div>
      ) : (
        <div className="space-y-2.5">
          {leaves.map(l => {
            const sm = STATUS_META[l.status] ?? STATUS_META.pending;
            return (
              <div key={l.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: l.leave_type === "emergency" ? "#FFF1F2" : "#EEF2FF", color: l.leave_type === "emergency" ? "#E11D48" : "#4338CA" }}>
                    {l.leave_type === "emergency" ? "Emergency" : "Normal"}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "#1E293B" }}>
                  {fmt(l.start_date)}{!l.is_half_day ? ` → ${fmt(l.end_date)}` : " (half day)"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{l.reason}</p>
                {l.status === "pending" && (
                  <button onClick={() => cancel(l.id)} className="text-xs font-medium mt-2" style={{ color: "#DC2626" }}>Cancel Application</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5"
              style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E2E8F0" }} />
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>Apply for Leave</h2>
              <form onSubmit={submit} className="space-y-3">
                <select
                  value={form.leave_type}
                  onChange={e => setForm({ ...form, leave_type: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl text-sm border"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <option value="normal">Normal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="px-3.5 py-3 rounded-xl text-sm border" style={{ borderColor: "#E2E8F0" }} />
                  <input type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="px-3.5 py-3 rounded-xl text-sm border" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <textarea
                  required
                  placeholder="Reason for leave"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl text-sm border resize-none"
                  style={{ borderColor: "#E2E8F0" }}
                  rows={3}
                />
                {error && <div className="px-3.5 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{error}</div>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
