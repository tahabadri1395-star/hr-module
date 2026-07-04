"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Expense {
  id: number; title: string; description: string | null;
  category: string; amount: string; receipt_url: string | null;
  expense_date: string; status: "pending" | "approved" | "rejected";
  admin_note: string | null; approved_by: string | null; approved_at: string | null;
  created_at: string;
  employee_name: string; department: string | null; employee_code: string | null;
}

interface Stats {
  pending: string; approved: string; rejected: string; total_approved_amount: string;
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
  pending:  { label: "Pending",  color: "#B45309", bg: "#FFFBEB" },
  approved: { label: "Approved", color: "#15803D", bg: "#F0FDF4" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtAmount(a: string | number) { return `₹${parseFloat(String(a)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [filter, setFilter]     = useState("pending");
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<number | null>(null);
  const [noteMap, setNoteMap]   = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/expenses?status=${filter}`);
    if (res.ok) {
      const d = await res.json();
      setExpenses(d.expenses);
      setStats(d.stats);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function action(id: number, status: "approved" | "rejected") {
    setActing(id);
    await fetch(`/api/admin/expenses/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_note: noteMap[id] || "" }),
    });
    setActing(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this expense claim?")) return;
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <div style={{ backgroundColor: "#0F172A" }}>
        <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
            </div>
            <span className="font-bold text-sm text-white">HR Module</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}>Admin</span>
          </div>
          <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
        </nav>

        <div className="px-6 pb-8 pt-2 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Expense Claims</h1>
          {stats && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: "Pending",  value: parseInt(stats.pending),  color: "#F59E0B" },
                { label: "Approved", value: parseInt(stats.approved), color: "#22C55E" },
                { label: "Rejected", value: parseInt(stats.rejected), color: "#EF4444" },
                { label: "Total Reimbursed", value: fmtAmount(stats.total_approved_amount), color: "#38BDF8" },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-4 py-3" style={{ backgroundColor: "#1E293B" }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-6xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {["pending", "approved", "rejected", "all"].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
              style={filter === t
                ? { backgroundColor: "#F59E0B", color: "#1E293B" }
                : { backgroundColor: "white", color: "#64748B", border: "1px solid #E2E8F0" }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#94A3B8" }}>Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>No expense claims</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Nothing in this category yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map(exp => {
              const cat = CAT_META[exp.category] ?? CAT_META.other;
              const st  = STATUS_META[exp.status];
              return (
                <div key={exp.id} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
                        {exp.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{exp.employee_name}</p>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                          {exp.employee_code && <span>{exp.employee_code} · </span>}
                          {exp.department || "No dept"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold" style={{ color: "#1E293B" }}>{fmtAmount(exp.amount)}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>

                  {/* Claim info */}
                  <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: "#F8FAFC" }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{exp.title}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{fmt(exp.expense_date)}</span>
                    </div>
                    {exp.description && <p className="text-xs" style={{ color: "#64748B" }}>{exp.description}</p>}
                  </div>

                  {exp.receipt_url && (
                    <a href={exp.receipt_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium mb-3"
                      style={{ color: "#4F46E5" }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      View Receipt
                    </a>
                  )}

                  {exp.admin_note && (
                    <div className="mb-3 p-2 rounded-lg text-xs" style={{ backgroundColor: exp.status === "approved" ? "#F0FDF4" : "#FEF2F2", color: exp.status === "approved" ? "#15803D" : "#DC2626" }}>
                      <span className="font-semibold">Note: </span>{exp.admin_note}
                      {exp.approved_by && <span style={{ color: "#94A3B8" }}> — {exp.approved_by}</span>}
                    </div>
                  )}

                  {exp.status === "pending" && (
                    <div className="space-y-2">
                      <textarea
                        value={noteMap[exp.id] || ""}
                        onChange={e => setNoteMap(m => ({ ...m, [exp.id]: e.target.value }))}
                        rows={2} placeholder="Admin note (optional)…"
                        className="w-full text-xs px-3 py-2 rounded-xl outline-none resize-none"
                        style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} />
                      <div className="flex gap-2">
                        <button onClick={() => action(exp.id, "approved")} disabled={acting === exp.id}
                          className="flex-1 text-xs font-semibold py-2 rounded-xl"
                          style={{ backgroundColor: "#F0FDF4", color: "#15803D", border: "1.5px solid #BBF7D0", opacity: acting === exp.id ? 0.6 : 1 }}>
                          {acting === exp.id ? "…" : "Approve"}
                        </button>
                        <button onClick={() => action(exp.id, "rejected")} disabled={acting === exp.id}
                          className="flex-1 text-xs font-semibold py-2 rounded-xl"
                          style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", opacity: acting === exp.id ? 0.6 : 1 }}>
                          {acting === exp.id ? "…" : "Reject"}
                        </button>
                        <button onClick={() => remove(exp.id)}
                          className="text-xs px-3 py-2 rounded-xl"
                          style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {exp.status !== "pending" && (
                    <div className="flex justify-end">
                      <button onClick={() => remove(exp.id)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                        Delete
                      </button>
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
