"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TravelRequest {
  id: number; travel_type: string; destination: string; purpose: string;
  travel_date: string; return_date: string | null; estimated_cost: string | null;
  status: "pending" | "approved" | "rejected"; admin_note: string | null; created_at: string;
}
interface Reimbursement {
  id: number; travel_id: number | null; description: string; amount: string;
  receipt_date: string; category: string; status: "pending" | "approved" | "rejected";
  admin_note: string | null; created_at: string;
}

type Tab = "travel" | "reimbursement";

const STATUS_META = {
  pending:  { label: "Pending",  bg: "#FFFBEB", color: "#B45309" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#15803D" },
  rejected: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
};
const TYPE_META: Record<string, string> = {
  site_visit: "Site Visit", outstation: "Outstation", local: "Local Travel",
};
const CATEGORY_META: Record<string, string> = {
  transport: "Transport", accommodation: "Accommodation", meals: "Meals", other: "Other",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TravelPage() {
  const [tab, setTab] = useState<Tab>("travel");
  const [travel, setTravel] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showReimbForm, setShowReimbForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  const [tForm, setTForm] = useState({ travel_type: "site_visit", destination: "", purpose: "", travel_date: "", return_date: "", estimated_cost: "" });
  const [rForm, setRForm] = useState({ travel_id: "", description: "", amount: "", receipt_date: "", category: "other" });

  const load = useCallback(async () => {
    const res = await fetch("/api/travel");
    if (res.ok) { const d = await res.json(); setTravel(d.travel); setReimbursements(d.reimbursements); }
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

  async function submitReimb() {
    if (!rForm.description.trim() || !rForm.amount || !rForm.receipt_date) { setMsg({ text: "Description, amount, and receipt date are required.", ok: false }); return; }
    setSaving(true); setMsg({ text: "", ok: true });
    const res = await fetch("/api/reimbursements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rForm) });
    setSaving(false);
    if (res.ok) { setShowReimbForm(false); setRForm({ travel_id: "", description: "", amount: "", receipt_date: "", category: "other" }); load(); setMsg({ text: "Reimbursement claim submitted.", ok: true }); }
    else { const d = await res.json(); setMsg({ text: d.error || "Failed.", ok: false }); }
  }

  async function withdrawTravel(id: number) {
    if (!confirm("Withdraw this travel request?")) return;
    await fetch(`/api/travel/${id}`, { method: "DELETE" }); load();
  }
  async function withdrawReimb(id: number) {
    if (!confirm("Withdraw this claim?")) return;
    await fetch(`/api/reimbursements/${id}`, { method: "DELETE" }); load();
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white";
  const iStyle = { borderColor: "#E2E8F0", color: "#1E293B" };

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
            <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Travel & Reimbursement</h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>Site visits, travel requests, and expense claims</p>
          </div>
          <button
            onClick={() => { if (tab === "travel") { setShowTravelForm(true); setShowReimbForm(false); } else { setShowReimbForm(true); setShowTravelForm(false); } setMsg({ text: "", ok: true }); }}
            className="text-sm font-medium px-4 py-2.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {tab === "travel" ? "+ New Request" : "+ New Claim"}
          </button>
        </div>

        {msg.text && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: msg.ok ? "#F0FDF4" : "#FEF2F2", color: msg.ok ? "#15803D" : "#DC2626" }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: "#F1F5F9" }}>
          {([["travel", "Travel Requests"], ["reimbursement", "Reimbursement Claims"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setShowTravelForm(false); setShowReimbForm(false); setMsg({ text: "", ok: true }); }}
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
                  placeholder="Location / site name…" className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Purpose *</label>
                <textarea value={tForm.purpose} onChange={e => setTForm(f => ({ ...f, purpose: e.target.value }))}
                  rows={2} placeholder="Purpose of visit…" className={inputClass + " resize-none"} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Travel Date *</label>
                <input type="date" value={tForm.travel_date} onChange={e => setTForm(f => ({ ...f, travel_date: e.target.value }))}
                  className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Return Date</label>
                <input type="date" value={tForm.return_date} onChange={e => setTForm(f => ({ ...f, return_date: e.target.value }))}
                  className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Estimated Cost (₹)</label>
                <input type="number" value={tForm.estimated_cost} onChange={e => setTForm(f => ({ ...f, estimated_cost: e.target.value }))}
                  placeholder="0.00" className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
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

        {/* Reimbursement Form */}
        {tab === "reimbursement" && showReimbForm && (
          <div className="bg-white rounded-xl border p-6 mb-5" style={{ borderColor: "#4F46E5" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>New Reimbursement Claim</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description *</label>
                <input value={rForm.description} onChange={e => setRForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What was the expense for?" className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Amount (₹) *</label>
                <input type="number" value={rForm.amount} onChange={e => setRForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Receipt Date *</label>
                <input type="date" value={rForm.receipt_date} onChange={e => setRForm(f => ({ ...f, receipt_date: e.target.value }))}
                  className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Category</label>
                <select value={rForm.category} onChange={e => setRForm(f => ({ ...f, category: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="transport">Transport</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="meals">Meals</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Link to Travel Request</label>
                <select value={rForm.travel_id} onChange={e => setRForm(f => ({ ...f, travel_id: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="">None (standalone claim)</option>
                  {travel.filter(t => t.status === "approved").map(t => (
                    <option key={t.id} value={t.id}>{t.destination} — {fmt(t.travel_date)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitReimb} disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Claim"}
              </button>
              <button onClick={() => setShowReimbForm(false)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Travel List */}
        {tab === "travel" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
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

        {/* Reimbursement List */}
        {tab === "reimbursement" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>My Claims</h2>
              {reimbursements.length > 0 && (
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Total approved: ₹{reimbursements.filter(r => r.status === "approved").reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}
                </p>
              )}
            </div>
            {reimbursements.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>No claims yet</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Submit your first reimbursement claim</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {reimbursements.map(r => {
                  const sm = STATUS_META[r.status];
                  return (
                    <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CATEGORY_META[r.category]}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: "#1E293B" }}>{r.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Receipt: {fmt(r.receipt_date)}</p>
                        {r.status === "rejected" && r.admin_note && (
                          <div className="mt-2 px-3 py-2 rounded-lg border text-xs" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECDD3", color: "#7F1D1D" }}>
                            <span className="font-semibold text-red-600">Note: </span>{r.admin_note}
                          </div>
                        )}
                        {r.status === "pending" && (
                          <button onClick={() => withdrawReimb(r.id)} className="mt-2 text-xs" style={{ color: "#DC2626" }}>Withdraw</button>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#1E293B" }}>₹{parseFloat(r.amount).toLocaleString()}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(r.created_at)}</p>
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
