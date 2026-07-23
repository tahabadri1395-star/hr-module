"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TravelRequest {
  id: number; travel_type: string; destination: string; purpose: string;
  travel_date: string; return_date: string | null; estimated_cost: string | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null; created_at: string;
}
interface Expense {
  id: number; title: string; description: string | null; category: string; amount: string;
  receipt_url: string | null; expense_date: string; travel_id: number | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null; created_at: string;
}

type Tab = "travel" | "expenses";

const STATUS_META = {
  pending:  { label: "Pending",  bg: "#FFFBEB", color: "#B45309" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#15803D" },
  rejected: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
};
const TYPE_META: Record<string, string> = {
  site_visit: "Site Visit", outstation: "Outstation", local: "Local Travel",
};
const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  travel:          { label: "Travel",          color: "#2563EB", bg: "#EFF6FF" },
  food:            { label: "Food",            color: "#D97706", bg: "#FFFBEB" },
  accommodation:   { label: "Accommodation",   color: "#7C3AED", bg: "#EDE9FE" },
  office_supplies: { label: "Office Supplies", color: "#0891B2", bg: "#ECFEFF" },
  communication:   { label: "Communication",   color: "#059669", bg: "#ECFDF5" },
  other:           { label: "Other",           color: "#64748B", bg: "#F1F5F9" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtAmount(a: string) { return `₹${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function TravelPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [tab, setTab] = useState<Tab>("travel");
  const [travel, setTravel] = useState<TravelRequest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  const [tForm, setTForm] = useState({ travel_type: "site_visit", destination: "", purpose: "", travel_date: "", return_date: "", estimated_cost: "" });
  const [eForm, setEForm] = useState({ title: "", description: "", category: "travel", amount: "", receipt_url: "", expense_date: today, travel_id: "" });

  const load = useCallback(async () => {
    const [travelRes, expensesRes] = await Promise.all([
      fetch("/api/travel"),
      fetch("/api/expenses?status=all"),
    ]);
    if (travelRes.ok) { const d = await travelRes.json(); setTravel(d.travel); }
    if (expensesRes.ok) setExpenses(await expensesRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitTravel() {
    if (!tForm.destination.trim() || !tForm.purpose.trim() || !tForm.travel_date) { setMsg({ text: "Destination, purpose, and travel date are required.", ok: false }); return; }
    setSaving(true); setMsg({ text: "", ok: true });
    const res = await fetch("/api/travel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tForm) });
    setSaving(false);
    if (res.ok) { setShowTravelForm(false); setTForm({ travel_type: "site_visit", destination: "", purpose: "", travel_date: "", return_date: "", estimated_cost: "" }); load(); setMsg({ text: "Travel request submitted.", ok: true }); }
    else { const d = await res.json(); setMsg({ text: d.error || "Failed.", ok: false }); }
  }

  async function submitExpense() {
    if (!eForm.title.trim() || !eForm.amount || !eForm.expense_date) { setMsg({ text: "Title, amount and date are required.", ok: false }); return; }
    setSaving(true); setMsg({ text: "", ok: true });
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eForm, travel_id: eForm.travel_id || null }),
    });
    setSaving(false);
    if (res.ok) { setShowExpenseForm(false); setEForm({ title: "", description: "", category: "travel", amount: "", receipt_url: "", expense_date: today, travel_id: "" }); load(); setMsg({ text: "Expense claim submitted.", ok: true }); }
    else { const d = await res.json(); setMsg({ text: d.error || "Failed.", ok: false }); }
  }

  async function withdrawTravel(id: number) {
    if (!confirm("Withdraw this travel request?")) return;
    await fetch(`/api/travel/${id}`, { method: "DELETE" }); load();
  }
  async function withdrawExpense(id: number) {
    if (!confirm("Withdraw this claim?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" }); load();
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white";
  const iStyle = { borderColor: "#E2E8F0", color: "#1E293B" };

  const pendingTravel  = travel.filter(t => t.status === "pending").length;
  const pendingExpense = expenses.filter(e => e.status === "pending").length;
  const totalApproved  = expenses.filter(e => e.status === "approved").reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs" style={{ color: "#64748B" }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Travel & Expenses</h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>Site visits, travel requests, and expense claims</p>
          </div>
          <button
            onClick={() => { if (tab === "travel") { setShowTravelForm(true); setShowExpenseForm(false); } else { setShowExpenseForm(true); setShowTravelForm(false); } setMsg({ text: "", ok: true }); }}
            className="text-sm font-medium px-4 py-2.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {tab === "travel" ? "+ New Request" : "+ New Claim"}
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Travel",  value: pendingTravel,  color: "#B45309" },
            { label: "Pending Claims",  value: pendingExpense, color: "#0891B2" },
            { label: "Total Reimbursed", value: fmtAmount(totalApproved.toString()), color: "#15803D" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {msg.text && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: msg.ok ? "#F0FDF4" : "#FEF2F2", color: msg.ok ? "#15803D" : "#DC2626" }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: "#F1F5F9" }}>
          {([["travel", "Travel Requests"], ["expenses", "Expense Claims"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setShowTravelForm(false); setShowExpenseForm(false); setMsg({ text: "", ok: true }); }}
              className="flex-1 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: tab === key ? "white" : "transparent", color: tab === key ? "#1E293B" : "#64748B",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Travel Request Form */}
        {tab === "travel" && showTravelForm && (
          <div className="bg-white rounded-xl border p-6 mb-5" style={{ borderColor: "#4F46E5" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>New Travel Request</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Travel Type</label>
                <select value={tForm.travel_type} onChange={e => setTForm(f => ({ ...f, travel_type: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="site_visit">Site Visit</option>
                  <option value="outstation">Outstation</option>
                  <option value="local">Local Travel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Destination *</label>
                <input value={tForm.destination} onChange={e => setTForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Location / site name…" className={inputClass} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Purpose *</label>
                <textarea value={tForm.purpose} onChange={e => setTForm(f => ({ ...f, purpose: e.target.value }))}
                  rows={2} placeholder="Purpose of visit…" className={inputClass + " resize-none"} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Travel Date *</label>
                <input type="date" value={tForm.travel_date} onChange={e => setTForm(f => ({ ...f, travel_date: e.target.value }))}
                  className={inputClass} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Return Date</label>
                <input type="date" value={tForm.return_date} onChange={e => setTForm(f => ({ ...f, return_date: e.target.value }))}
                  className={inputClass} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Estimated Cost (₹)</label>
                <input type="number" value={tForm.estimated_cost} onChange={e => setTForm(f => ({ ...f, estimated_cost: e.target.value }))}
                  placeholder="0.00" className={inputClass} style={iStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitTravel} disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Request"}
              </button>
              <button onClick={() => setShowTravelForm(false)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Expense Claim Form */}
        {tab === "expenses" && showExpenseForm && (
          <div className="bg-white rounded-xl border p-6 mb-5" style={{ borderColor: "#4F46E5" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>New Expense Claim</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Title *</label>
                <input value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Taxi to client site" className={inputClass} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Category *</label>
                <select value={eForm.category} onChange={e => setEForm(f => ({ ...f, category: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Amount (₹) *</label>
                <input type="number" min="0" step="0.01" value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className={inputClass} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Expense Date *</label>
                <input type="date" value={eForm.expense_date} onChange={e => setEForm(f => ({ ...f, expense_date: e.target.value }))}
                  className={inputClass} style={iStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Link to Travel Request</label>
                <select value={eForm.travel_id} onChange={e => setEForm(f => ({ ...f, travel_id: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="">None (standalone claim)</option>
                  {travel.filter(t => t.status === "approved").map(t => (
                    <option key={t.id} value={t.id}>{t.destination} — {fmt(t.travel_date)}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Receipt URL <span style={{ color: "#94A3B8" }}>(Google Drive / OneDrive link)</span></label>
                <input value={eForm.receipt_url} onChange={e => setEForm(f => ({ ...f, receipt_url: e.target.value }))}
                  placeholder="https://drive.google.com/..." className={inputClass} style={iStyle} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description</label>
                <textarea value={eForm.description} onChange={e => setEForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Additional details…" className={inputClass + " resize-none"} style={iStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitExpense} disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Claim"}
              </button>
              <button onClick={() => setShowExpenseForm(false)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Travel List */}
        {tab === "travel" && (
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>My Travel Requests</h2>
            </div>
            {travel.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>No requests yet</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Submit a travel request to get started</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {travel.map(t => {
                  const sm = STATUS_META[t.status];
                  return (
                    <div key={t.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{TYPE_META[t.travel_type]}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: "#1E293B" }}>{t.destination}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{t.purpose}</p>
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                          {fmt(t.travel_date)}{t.return_date ? ` — ${fmt(t.return_date)}` : ""}
                          {t.estimated_cost ? ` · Est. ₹${parseFloat(t.estimated_cost).toLocaleString()}` : ""}
                        </p>
                        {t.status === "rejected" && t.admin_note && (
                          <div className="mt-2 px-3 py-2 rounded-lg border text-xs" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECDD3", color: "#7F1D1D" }}>
                            <span className="font-semibold text-red-600">Note: </span>{t.admin_note}
                          </div>
                        )}
                        {t.status === "pending" && (
                          <button onClick={() => withdrawTravel(t.id)} className="mt-2 text-xs" style={{ color: "#DC2626" }}>Withdraw</button>
                        )}
                      </div>
                      <p className="text-xs shrink-0" style={{ color: "#94A3B8" }}>{fmt(t.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Expense Claims List */}
        {tab === "expenses" && (
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>My Claims</h2>
              {expenses.length > 0 && (
                <p className="text-xs" style={{ color: "#64748B" }}>Total approved: {fmtAmount(totalApproved.toString())}</p>
              )}
            </div>
            {expenses.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>No claims yet</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Submit your first expense claim</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {expenses.map(exp => {
                  const cat = CAT_META[exp.category] ?? CAT_META.other;
                  const sm  = STATUS_META[exp.status];
                  return (
                    <div key={exp.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: "#1E293B" }}>{exp.title}</p>
                        {exp.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{exp.description}</p>}
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{fmt(exp.expense_date)}</p>
                        {exp.receipt_url && (
                          <a href={exp.receipt_url} target="_blank" rel="noreferrer"
                            className="text-xs font-medium mt-1 inline-flex items-center gap-1" style={{ color: "#4F46E5" }}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            View Receipt
                          </a>
                        )}
                        {exp.status === "rejected" && exp.admin_note && (
                          <div className="mt-2 px-3 py-2 rounded-lg border text-xs" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECDD3", color: "#7F1D1D" }}>
                            <span className="font-semibold text-red-600">Note: </span>{exp.admin_note}
                          </div>
                        )}
                        {exp.status === "pending" && (
                          <button onClick={() => withdrawExpense(exp.id)} className="mt-2 text-xs" style={{ color: "#DC2626" }}>Withdraw</button>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{fmtAmount(exp.amount)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(exp.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
