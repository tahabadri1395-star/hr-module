"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bg, ink, muted, accent, neuRaised, neuInset, accentGradient, accentShadow } from "@/lib/mobile-theme";

interface TravelReq {
  id: number;
  travel_type: string;
  destination: string;
  purpose: string;
  travel_date: string;
  return_date: string | null;
  estimated_cost: string | null;
  status: string;
}
interface Expense {
  id: number;
  title: string;
  category: string;
  amount: string;
  expense_date: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#B45309",
  approved: "#15803D",
  rejected: "#DC2626",
};

const inputStyle = { backgroundColor: bg, boxShadow: neuInset, color: ink };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtAmt(a: string) { return `₹${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function MobileTravelPage() {
  const [tab, setTab] = useState<"travel" | "expenses">("travel");
  const [travel, setTravel] = useState<TravelReq[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [travelForm, setTravelForm] = useState({ travel_type: "site_visit", destination: "", purpose: "", travel_date: "", return_date: "", estimated_cost: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "other", amount: "", expense_date: "" });

  const load = useCallback(async () => {
    const [tRes, eRes] = await Promise.all([fetch("/api/travel"), fetch("/api/expenses")]);
    if (tRes.ok) setTravel((await tRes.json()).travel);
    if (eRes.ok) setExpenses(await eRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitTravel(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const body = { ...travelForm, estimated_cost: travelForm.estimated_cost ? parseFloat(travelForm.estimated_cost) : undefined };
      const res = await fetch("/api/travel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit.");
      setSheetOpen(false);
      setTravelForm({ travel_type: "site_visit", destination: "", purpose: "", travel_date: "", return_date: "", estimated_cost: "" });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit."); }
    finally { setSubmitting(false); }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const body = { ...expenseForm, amount: parseFloat(expenseForm.amount) };
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit.");
      setSheetOpen(false);
      setExpenseForm({ title: "", category: "other", amount: "", expense_date: "" });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="flex gap-1 p-1.5 rounded-2xl" style={{ backgroundColor: bg, boxShadow: neuInset }}>
        {(["travel", "expenses"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: bg, color: tab === t ? accent : muted, boxShadow: tab === t ? neuRaised : "none" }}
          >
            {t === "travel" ? "Travel" : "Expenses"}
          </button>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setError(""); setSheetOpen(true); }}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: accentGradient, boxShadow: accentShadow }}
      >
        + New {tab === "travel" ? "Travel Request" : "Expense Claim"}
      </motion.button>

      {loading ? (
        <div className="rounded-3xl h-40" style={{ backgroundColor: bg, boxShadow: neuInset }} />
      ) : tab === "travel" ? (
        travel.length === 0 ? (
          <div className="rounded-3xl py-12 text-center text-sm" style={{ color: muted, backgroundColor: bg, boxShadow: neuRaised }}>No travel requests yet.</div>
        ) : (
          <div className="space-y-2.5">
            {travel.map(t => {
              const color = STATUS_COLOR[t.status] ?? STATUS_COLOR.pending;
              return (
                <div key={t.id} className="rounded-3xl p-4" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: bg, boxShadow: neuInset, color: accent }}>{t.travel_type.replace("_", " ")}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: bg, boxShadow: neuInset, color }}>{t.status}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: ink }}>{t.destination}</p>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>{t.purpose}</p>
                  <p className="text-xs mt-1" style={{ color: muted }}>{fmt(t.travel_date)}{t.return_date ? ` → ${fmt(t.return_date)}` : ""}</p>
                </div>
              );
            })}
          </div>
        )
      ) : expenses.length === 0 ? (
        <div className="rounded-3xl py-12 text-center text-sm" style={{ color: muted, backgroundColor: bg, boxShadow: neuRaised }}>No expense claims yet.</div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map(e => {
            const color = STATUS_COLOR[e.status] ?? STATUS_COLOR.pending;
            return (
              <div key={e.id} className="rounded-3xl p-4 flex items-center justify-between gap-3" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
                <div className="min-w-0">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: bg, boxShadow: neuInset, color }}>{e.status}</span>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: ink }}>{e.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>{fmt(e.expense_date)}</p>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: ink }}>{fmtAmt(e.amount)}</p>
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
              <h2 className="text-base font-bold mb-4" style={{ color: ink }}>{tab === "travel" ? "New Travel Request" : "New Expense Claim"}</h2>

              {tab === "travel" ? (
                <form onSubmit={submitTravel} className="space-y-3">
                  <select value={travelForm.travel_type} onChange={e => setTravelForm({ ...travelForm, travel_type: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
                    <option value="site_visit">Site Visit</option>
                    <option value="outstation">Outstation</option>
                    <option value="local">Local Travel</option>
                  </select>
                  <input required placeholder="Destination" value={travelForm.destination} onChange={e => setTravelForm({ ...travelForm, destination: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  <textarea required placeholder="Purpose" value={travelForm.purpose} onChange={e => setTravelForm({ ...travelForm, purpose: e.target.value })} rows={2} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" required value={travelForm.travel_date} onChange={e => setTravelForm({ ...travelForm, travel_date: e.target.value })} className="px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                    <input type="date" value={travelForm.return_date} onChange={e => setTravelForm({ ...travelForm, return_date: e.target.value })} className="px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  </div>
                  <input type="number" placeholder="Estimated cost (optional)" value={travelForm.estimated_cost} onChange={e => setTravelForm({ ...travelForm, estimated_cost: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  {error && <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: bg, boxShadow: neuInset, color: "#DC2626" }}>{error}</div>}
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: accentGradient, boxShadow: accentShadow, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={submitExpense} className="space-y-3">
                  <input required placeholder="Title" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
                    <option value="travel">Travel</option>
                    <option value="food">Food</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="office_supplies">Office Supplies</option>
                    <option value="communication">Communication</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="number" required placeholder="Amount (₹)" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  <input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                  {error && <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: bg, boxShadow: neuInset, color: "#DC2626" }}>{error}</div>}
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: accentGradient, boxShadow: accentShadow, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "Submitting…" : "Submit Claim"}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
