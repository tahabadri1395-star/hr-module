"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ApplyLeavePage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    leave_type: "normal",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emergencyRemaining, setEmergencyRemaining] = useState<number | null>(null);
  const [advanceWarning, setAdvanceWarning] = useState(false);

  useEffect(() => {
    fetch("/api/leave/my-leaves")
      .then(r => r.json())
      .then(data => {
        if (data.emergency_remaining !== undefined) setEmergencyRemaining(data.emergency_remaining);
      })
      .catch(() => {});
  }, []);

  // Auto-switch to emergency if start_date is < 2 days away
  useEffect(() => {
    if (!form.start_date) { setAdvanceWarning(false); return; }
    const daysAhead = Math.floor((new Date(form.start_date).setHours(0,0,0,0) - new Date(today).setHours(0,0,0,0)) / 86400000);
    if (daysAhead < 2) {
      setAdvanceWarning(true);
      setForm(f => ({ ...f, leave_type: "emergency" }));
    } else {
      setAdvanceWarning(false);
    }
  }, [form.start_date, today]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!form.reason.trim()) { setError("Reason is required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Nav */}
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M9 13h6M9 16h4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: "#64748B" }}>← Back to Dashboard</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Apply for Leave</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Fill in the details below to submit a leave request</p>
        </div>

        {emergencyRemaining !== null && (
          <div className="mb-5 px-5 py-3.5 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: emergencyRemaining === 0 ? "#FFF1F2" : "#EEF2FF", borderColor: emergencyRemaining === 0 ? "#FECDD3" : "#C7D2FE" }}>
            <span className="text-xs font-medium" style={{ color: emergencyRemaining === 0 ? "#E11D48" : "#4338CA" }}>
              Emergency Leave Remaining (this year)
            </span>
            <span className="text-sm font-bold" style={{ color: emergencyRemaining === 0 ? "#E11D48" : "#4338CA" }}>
              {emergencyRemaining} / 7
            </span>
          </div>
        )}

        {success ? (
          <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#1E293B" }}>Application Submitted</h2>
            <p className="text-sm" style={{ color: "#64748B" }}>Your leave request is pending approval. Redirecting...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-8" style={{ borderColor: "#E2E8F0" }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-medium mb-3" style={{ color: "#64748B" }}>Leave Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "normal",    label: "Normal Leave",    desc: "Apply 2+ days in advance", icon: "📅", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
                    { value: "emergency", label: "Emergency Leave",  desc: `${emergencyRemaining ?? "—"} of 7 remaining`, icon: "🚨", color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, leave_type: opt.value }))}
                      disabled={opt.value === "emergency" && emergencyRemaining === 0}
                      className="relative p-4 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: form.leave_type === opt.value ? opt.border : "#E2E8F0",
                        backgroundColor: form.leave_type === opt.value ? opt.bg : "white",
                        opacity: opt.value === "emergency" && emergencyRemaining === 0 ? 0.5 : 1,
                        cursor: opt.value === "emergency" && emergencyRemaining === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className="text-xs font-semibold" style={{ color: form.leave_type === opt.value ? opt.color : "#1E293B" }}>
                        {opt.label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{opt.desc}</div>
                      {form.leave_type === opt.value && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: opt.color }}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {advanceWarning && (
                  <div className="mt-3 px-4 py-3 rounded-lg text-xs" style={{ backgroundColor: "#FFFBEB", color: "#92400E", borderLeft: "3px solid #F59E0B" }}>
                    <strong>Notice:</strong> Your selected start date is less than 2 days away — automatically switched to Emergency Leave.
                  </div>
                )}

                {form.leave_type === "normal" && (
                  <div className="mt-3 px-4 py-3 rounded-lg text-xs" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>
                    Normal leave must be applied at least <strong>2 days before</strong> the start date.
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    min={today}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, start_date: val, end_date: f.end_date < val ? val : f.end_date }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                    onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date || today}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                    onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>
                  Reason <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Provide a detailed reason for your leave request..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none resize-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                  required
                />
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Reason is mandatory for all leave types.</p>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href="/dashboard"
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-white" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#4338CA" }}>Normal Leave</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Must apply at least <strong>2 days</strong> before start date. No annual limit.</p>
          </div>
          <div className="p-4 rounded-xl border bg-white" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#E11D48" }}>Emergency Leave</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Can be applied anytime. <strong>Limited to 7</strong> applications per calendar year.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
