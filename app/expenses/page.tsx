"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Expense {
  id: number; title: string; description: string | null;
  category: string; amount: string; receipt_url: string | null;
  expense_date: string; status: "pending" | "approved" | "rejected";
  admin_note: string | null; approved_by: string | null; created_at: string;
}

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  travel:          { label: "Travel",          color: "#2563EB", bg: "#EFF6FF" },
  food:            { label: "Food",            color: "#D97706", bg: "#FFFBEB" },
  accommodation:   { label: "Accommodation",   color: "#7C3AED", bg: "#EDE9FE" },
  office_supplies: { label: "Office Supplies", color: "#0891B2", bg: "#ECFEFF" },
  communication:   { label: "Communication",   color: "#059669", bg: "#ECFDF5" },
  other:           { label: "Other",           color: "#64748B", bg: "#F1F5F9" },
};

const STATUS_META = {
  pending:  { label: "Pending",  color: "#B45309", bg: "#FFFBEB", dot: "#F59E0B" },
  approved: { label: "Approved", color: "#15803D", bg: "#F0FDF4", dot: "#22C55E" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtAmount(a: string) { return `₹${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function ExpensesPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [filter, setFilter]       = useState("all");
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState("");

  const [form, setForm] = useState({
    title: "", description: "", category: "travel",
    amount: "", receipt_url: "", expense_date: today,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?status=${filter}`);
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || !form.expense_date) {
      setMsg("Title, amount and date are required."); return;
    }
    setSubmitting(true); setMsg("");
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ title: "", description: "", category: "travel", amount: "", receipt_url: "", expense_date: today });
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setMsg(d.error || "Submission failed.");
    }
  }

  const tabs = ["all", "pending", "approved", "rejected"];
  const totalPending  = expenses.filter(e => e.status === "pending").length;
  const totalApproved = expenses.filter(e => e.status === "approved");
  const approvedSum   = totalApproved.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#1E293B" }}>Expense Claims</h1>
            <p className="text-sm" style={{ color: "#64748B" }}>Submit and track your expense reimbursements</p>
          </div>
          <button onClick={() => { setShowForm(s => !s); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {showForm ? "Cancel" : "+ New Claim"}
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pending", value: totalPending, color: "#B45309", bg: "#FFFBEB" },
            { label: "Approved", value: totalApproved.length, color: "#15803D", bg: "#F0FDF4" },
            { label: "Reimbursed", value: fmtAmount(approvedSum.toString()), color: "#1D4ED8", bg: "#EFF6FF" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl py-4 px-3 text-center" style={{ backgroundColor: s.bg, border: `1px solid ${s.color}20` }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* New claim form */}
        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl p-5 mb-5 shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>New Expense Claim</h2>
            {msg && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{msg}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Taxi to client site"
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                    style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }}>
                    {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                    style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Expense Date *</label>
                <input type="date" value={form.expense_date}
                  onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} required />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Receipt URL <span style={{ color: "#94A3B8" }}>(Google Drive / OneDrive link)</span></label>
                <input value={form.receipt_url} onChange={e => setForm(f => ({ ...f, receipt_url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Additional details…"
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full text-sm font-semibold py-2.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting…" : "Submit Claim"}
              </button>
            </div>
          </form>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize whitespace-nowrap"
              style={filter === t
                ? { backgroundColor: "#4F46E5", color: "white" }
                : { backgroundColor: "white", color: "#64748B", border: "1px solid #E2E8F0" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Expense list */}
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>No expense claims</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Submit your first claim above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(exp => {
              const cat = CAT_META[exp.category] ?? CAT_META.other;
              const st  = STATUS_META[exp.status];
              return (
                <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#1E293B" }}>{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>{fmt(exp.expense_date)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold" style={{ color: "#1E293B" }}>{fmtAmount(exp.amount)}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>

                  {exp.description && <p className="text-xs mb-2" style={{ color: "#64748B" }}>{exp.description}</p>}

                  <div className="flex items-center gap-3">
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noreferrer"
                        className="text-xs font-medium flex items-center gap-1"
                        style={{ color: "#4F46E5" }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        View Receipt
                      </a>
                    )}
                  </div>

                  {exp.admin_note && (
                    <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: exp.status === "approved" ? "#F0FDF4" : "#FEF2F2", color: exp.status === "approved" ? "#15803D" : "#DC2626" }}>
                      <span className="font-semibold">Admin: </span>{exp.admin_note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
