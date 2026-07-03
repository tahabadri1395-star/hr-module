"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TravelRequest {
  id: number; travel_type: string; destination: string; purpose: string;
  travel_date: string; return_date: string | null; estimated_cost: string | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null;
  employee_name: string; department: string | null; employee_code: string | null; created_at: string;
}
interface Reimbursement {
  id: number; travel_id: number | null; description: string; amount: string;
  receipt_date: string; category: string; status: "pending" | "approved" | "rejected";
  admin_note: string | null; employee_name: string; department: string | null; created_at: string;
}

type Tab = "travel" | "reimbursement";

const STATUS_META = {
  pending:  { label: "Pending",  bg: "#FFFBEB", color: "#B45309" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#15803D" },
  rejected: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
};
const TYPE_META: Record<string, string> = { site_visit: "Site Visit", outstation: "Outstation", local: "Local Travel" };
const CATEGORY_META: Record<string, string> = { transport: "Transport", accommodation: "Accommodation", meals: "Meals", other: "Other" };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminTravelPage() {
  const [tab, setTab] = useState<Tab>("travel");
  const [travel, setTravel] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"travel" | "reimbursement">("travel");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/travel");
    if (res.ok) { const d = await res.json(); setTravel(d.travel); setReimbursements(d.reimbursements); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAction(id: number, type: "travel" | "reimbursement", dec: "approved" | "rejected") {
    setActionId(id); setActionType(type); setDecision(dec); setNote(""); setSaving(false);
  }

  async function submitAction() {
    if (!actionId) return;
    setSaving(true);
    const url = actionType === "travel" ? `/api/admin/travel/${actionId}` : `/api/admin/reimbursements/${actionId}`;
    await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: decision, admin_note: note }) });
    setSaving(false); setActionId(null); load();
  }

  const filteredTravel = travel.filter(t => filterStatus === "all" || t.status === filterStatus);
  const filteredReimb  = reimbursements.filter(r => filterStatus === "all" || r.status === filterStatus);
  const pendingTravel  = travel.filter(t => t.status === "pending").length;
  const pendingReimb   = reimbursements.filter(r => r.status === "pending").length;
  const totalApproved  = reimbursements.filter(r => r.status === "approved").reduce((s, r) => s + parseFloat(r.amount), 0);

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
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Travel & Reimbursement</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Review travel requests and expense claims</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Travel",       value: pendingTravel, color: "#B45309" },
            { label: "Pending Claims",        value: pendingReimb,  color: "#0891B2" },
            { label: "Total Reimbursed",      value: `₹${totalApproved.toLocaleString()}`, color: "#15803D" },
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
            {([["travel", "Travel Requests"], ["reimbursement", "Claims"]] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: tab === key ? "white" : "transparent", color: tab === key ? "#1E293B" : "#64748B",
                  boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {label}
                {((key === "travel" && pendingTravel > 0) || (key === "reimbursement" && pendingReimb > 0)) && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>
                    {key === "travel" ? pendingTravel : pendingReimb}
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

        {/* Action Modal */}
        {actionId !== null && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>
                {decision === "approved" ? "Approve" : "Reject"} {actionType === "travel" ? "Travel Request" : "Claim"}
              </h3>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Note (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder={decision === "rejected" ? "Reason for rejection…" : "Any note for the Khidmat Guzar…"}
                className={inputClass + " resize-none"} style={iStyle}
                onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
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
                            <button onClick={() => openAction(t.id, "travel", "approved")}
                              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>Approve</button>
                            <button onClick={() => openAction(t.id, "travel", "rejected")}
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

        {/* Reimbursement List */}
        {tab === "reimbursement" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            {filteredReimb.length === 0 ? (
              <div className="py-14 text-center text-sm" style={{ color: "#94A3B8" }}>No {filterStatus === "all" ? "" : filterStatus} claims.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {filteredReimb.map(r => {
                  const sm = STATUS_META[r.status];
                  return (
                    <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CATEGORY_META[r.category]}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{r.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium" style={{ color: "#4F46E5" }}>{r.employee_name}</span>
                          {r.department && <span className="text-xs" style={{ color: "#94A3B8" }}>{r.department}</span>}
                          <span className="text-xs" style={{ color: "#94A3B8" }}>Receipt: {fmt(r.receipt_date)}</span>
                        </div>
                        {r.admin_note && <p className="text-xs mt-1 italic" style={{ color: "#64748B" }}>Note: {r.admin_note}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-base font-bold" style={{ color: "#1E293B" }}>₹{parseFloat(r.amount).toLocaleString()}</p>
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => openAction(r.id, "reimbursement", "approved")}
                              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>Approve</button>
                            <button onClick={() => openAction(r.id, "reimbursement", "rejected")}
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
      </div>
    </div>
  );
}
