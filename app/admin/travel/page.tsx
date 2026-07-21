"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TravelRequest {
  id: number; travel_type: string; destination: string; purpose: string;
  travel_date: string; return_date: string | null; estimated_cost: string | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null;
  employee_name: string; department: string | null; employee_code: string | null; created_at: string;
}
interface Expense {
  id: number; title: string; description: string | null; category: string; amount: string;
  receipt_url: string | null; expense_date: string; travel_id: number | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null; approved_by: string | null;
  employee_name: string; department: string | null; employee_code: string | null; created_at: string;
}
interface Stats { pending: string; approved: string; rejected: string; total_approved_amount: string; }

type Tab = "travel" | "expenses";

const STATUS_META = {
  pending:  { label: "Pending",  bg: "#FFFBEB", color: "#B45309" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#15803D" },
  rejected: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
};
const TYPE_META: Record<string, string> = { site_visit: "Site Visit", outstation: "Outstation", local: "Local Travel" };
const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  travel:          { label: "Travel",          color: "#2563EB", bg: "#EFF6FF" },
  food:            { label: "Food",            color: "#D97706", bg: "#FFFBEB" },
  accommodation:   { label: "Accommodation",   color: "#7C3AED", bg: "#EDE9FE" },
  office_supplies: { label: "Office Supplies", color: "#0891B2", bg: "#ECFEFF" },
  communication:   { label: "Communication",   color: "#059669", bg: "#ECFDF5" },
  other:           { label: "Other",           color: "#64748B", bg: "#F1F5F9" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtAmount(a: string | number) { return `₹${parseFloat(String(a)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function AdminTravelPage() {
  const [tab, setTab] = useState<Tab>("travel");
  const [travel, setTravel] = useState<TravelRequest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [saving, setSaving] = useState(false);
  const [expenseNoteMap, setExpenseNoteMap] = useState<Record<number, string>>({});
  const [actingExpense, setActingExpense] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [travelRes, expensesRes] = await Promise.all([
      fetch("/api/admin/travel"),
      fetch(`/api/admin/expenses?status=${filterStatus}`),
    ]);
    if (travelRes.ok) { const d = await travelRes.json(); setTravel(d.travel); }
    if (expensesRes.ok) { const d = await expensesRes.json(); setExpenses(d.expenses); setExpenseStats(d.stats); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  function openAction(id: number, dec: "approved" | "rejected") {
    setActionId(id); setDecision(dec); setNote(""); setSaving(false);
  }

  async function submitAction() {
    if (!actionId) return;
    setSaving(true);
    await fetch(`/api/admin/travel/${actionId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: decision, admin_note: note }) });
    setSaving(false); setActionId(null); load();
  }

  async function expenseAction(id: number, status: "approved" | "rejected") {
    setActingExpense(id);
    await fetch(`/api/admin/expenses/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_note: expenseNoteMap[id] || "" }),
    });
    setActingExpense(null);
    load();
  }

  async function removeExpense(id: number) {
    if (!confirm("Delete this expense claim?")) return;
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const filteredTravel = travel.filter(t => filterStatus === "all" || t.status === filterStatus);
  const pendingTravel  = travel.filter(t => t.status === "pending").length;
  const pendingExpense = expenseStats ? parseInt(expenseStats.pending, 10) : 0;
  const totalApproved  = expenseStats ? parseFloat(expenseStats.total_approved_amount) : 0;

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white";
  const iStyle = { borderColor: "#E2E8F0", color: "#1E293B" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#64748B" }}>← Dashboard</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Travel & Expenses</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Review travel requests and expense claims</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Travel",  value: pendingTravel,  color: "#B45309" },
            { label: "Pending Claims",  value: pendingExpense, color: "#0891B2" },
            { label: "Total Reimbursed", value: fmtAmount(totalApproved), color: "#15803D" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Filter */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F1F5F9" }}>
            {([["travel", "Travel Requests"], ["expenses", "Expense Claims"]] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: tab === key ? "white" : "transparent", color: tab === key ? "#1E293B" : "#64748B",
                  boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {label}
                {((key === "travel" && pendingTravel > 0) || (key === "expenses" && pendingExpense > 0)) && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>
                    {key === "travel" ? pendingTravel : pendingExpense}
                  </span>
                )}
              </button>
            ))}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none" style={iStyle}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Travel Action Modal */}
        {actionId !== null && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>
                {decision === "approved" ? "Approve" : "Reject"} Travel Request
              </h3>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Note (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder={decision === "rejected" ? "Reason for rejection…" : "Any note for the Khidmat Guzar…"}
                className={inputClass + " resize-none"} style={iStyle} />
              <div className="flex gap-3 mt-4">
                <button onClick={submitAction} disabled={saving}
                  className="flex-1 text-sm font-medium py-2.5 rounded-lg text-white"
                  style={{ background: decision === "approved" ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#DC2626,#B91C1C)", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : decision === "approved" ? "Approve" : "Reject"}
                </button>
                <button onClick={() => setActionId(null)} className="flex-1 text-sm py-2.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Travel List */}
        {tab === "travel" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            {filteredTravel.length === 0 ? (
              <div className="py-14 text-center text-sm" style={{ color: "#94A3B8" }}>No {filterStatus === "all" ? "" : filterStatus} travel requests.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {filteredTravel.map(t => {
                  const sm = STATUS_META[t.status];
                  return (
                    <div key={t.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{TYPE_META[t.travel_type]}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{t.destination}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{t.purpose}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-medium" style={{ color: "#4F46E5" }}>{t.employee_name}</span>
                            {t.department && <span className="text-xs" style={{ color: "#94A3B8" }}>{t.department}</span>}
                            <span className="text-xs" style={{ color: "#94A3B8" }}>{fmt(t.travel_date)}{t.return_date ? ` → ${fmt(t.return_date)}` : ""}</span>
                            {t.estimated_cost && <span className="text-xs" style={{ color: "#94A3B8" }}>Est. ₹{parseFloat(t.estimated_cost).toLocaleString()}</span>}
                          </div>
                          {t.admin_note && <p className="text-xs mt-1.5 italic" style={{ color: "#64748B" }}>Note: {t.admin_note}</p>}
                        </div>
                        {t.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => openAction(t.id, "approved")}
                              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>Approve</button>
                            <button onClick={() => openAction(t.id, "rejected")}
                              className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Expense Claims List */}
        {tab === "expenses" && (
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="bg-white rounded-xl border py-14 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
                No {filterStatus === "all" ? "" : filterStatus} expense claims.
              </div>
            ) : (
              expenses.map(exp => {
                const cat = CAT_META[exp.category] ?? CAT_META.other;
                const sm  = STATUS_META[exp.status];
                return (
                  <div key={exp.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
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
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                      </div>
                    </div>

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
                        className="inline-flex items-center gap-1 text-xs font-medium mb-3" style={{ color: "#4F46E5" }}>
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

                    {exp.status === "pending" ? (
                      <div className="space-y-2">
                        <textarea
                          value={expenseNoteMap[exp.id] || ""}
                          onChange={e => setExpenseNoteMap(m => ({ ...m, [exp.id]: e.target.value }))}
                          rows={2} placeholder="Admin note (optional)…"
                          className="w-full text-xs px-3 py-2 rounded-xl outline-none resize-none"
                          style={{ border: "1.5px solid #E2E8F0", color: "#1E293B" }} />
                        <div className="flex gap-2">
                          <button onClick={() => expenseAction(exp.id, "approved")} disabled={actingExpense === exp.id}
                            className="flex-1 text-xs font-semibold py-2 rounded-xl"
                            style={{ backgroundColor: "#F0FDF4", color: "#15803D", border: "1.5px solid #BBF7D0", opacity: actingExpense === exp.id ? 0.6 : 1 }}>
                            {actingExpense === exp.id ? "…" : "Approve"}
                          </button>
                          <button onClick={() => expenseAction(exp.id, "rejected")} disabled={actingExpense === exp.id}
                            className="flex-1 text-xs font-semibold py-2 rounded-xl"
                            style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", opacity: actingExpense === exp.id ? 0.6 : 1 }}>
                            {actingExpense === exp.id ? "…" : "Reject"}
                          </button>
                          <button onClick={() => removeExpense(exp.id)}
                            className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button onClick={() => removeExpense(exp.id)}
                          className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
