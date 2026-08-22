"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

export default function ApplyLeavePage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    leave_type: "normal",
    start_date: "",
    end_date: "",
    is_half_day: false,
    half_day_period: "morning",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emergencyRemaining, setEmergencyRemaining] = useState<number | null>(null);
  const [advanceWarning, setAdvanceWarning] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [holidayWarning, setHolidayWarning] = useState("");

  useEffect(() => {
    fetch("/api/leave/my-leaves")
      .then(r => r.json())
      .then(data => { if (data.emergency_remaining !== undefined) setEmergencyRemaining(data.emergency_remaining); })
      .catch(() => {});

    fetch("/api/public/holidays")
      .then(r => r.json())
      .then(data => {
        const map: Record<string, string> = {};
        (data.holidays ?? []).forEach((h: { date: string; name: string }) => { map[h.date] = h.name; });
        setHolidays(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.start_date) { setAdvanceWarning(false); setHolidayWarning(""); return; }
    const daysAhead = Math.floor((new Date(form.start_date).setHours(0,0,0,0) - new Date(today).setHours(0,0,0,0)) / 86400000);
    if (daysAhead < 2) {
      setAdvanceWarning(true);
      setForm(f => ({ ...f, leave_type: "emergency" }));
    } else {
      setAdvanceWarning(false);
    }
    const warn: string[] = [];
    if (holidays[form.start_date]) warn.push(`${form.start_date} is ${holidays[form.start_date]}`);
    if (form.end_date && form.end_date !== form.start_date && holidays[form.end_date]) warn.push(`${form.end_date} is ${holidays[form.end_date]}`);
    setHolidayWarning(warn.join(". "));
  }, [form.start_date, form.end_date, today, holidays]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!form.reason.trim()) { setError("Reason is required."); return; }
    setLoading(true);
    try {
      const body = {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.is_half_day ? form.start_date : form.end_date,
        is_half_day: form.is_half_day,
        half_day_period: form.is_half_day ? form.half_day_period : null,
        reason: form.reason,
      };
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: muted }}>← Back to Dashboard</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10 relative">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: ink }}>Apply for Leave</h1>
          <p className="text-sm mt-1" style={{ color: muted }}>Fill in the details below to submit a leave request</p>
        </div>

        {emergencyRemaining !== null && (
          <div className="mb-5 px-5 py-3.5 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: emergencyRemaining === 0 ? "rgba(248,113,113,0.1)" : "rgba(167,139,250,0.1)", borderColor: emergencyRemaining === 0 ? "rgba(248,113,113,0.25)" : "rgba(167,139,250,0.25)" }}>
            <span className="text-xs font-medium" style={{ color: emergencyRemaining === 0 ? "#F87171" : "#A78BFA" }}>
              Emergency Leave Remaining (this year)
            </span>
            <span className="text-sm font-bold" style={{ color: emergencyRemaining === 0 ? "#F87171" : "#A78BFA" }}>
              {emergencyRemaining} / 7
            </span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl p-10 text-center animate-in" style={glassCard}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(74,222,128,0.15)" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: ink }}>Application Submitted</h2>
            <p className="text-sm" style={{ color: muted }}>Your leave request is pending approval. Redirecting...</p>
          </div>
        ) : (
          <div className="rounded-xl p-8 animate-in" style={glassCard}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-medium mb-3" style={{ color: muted }}>Leave Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "normal",    label: "Normal Leave",   desc: "Apply 2+ days in advance",                     color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)" },
                    { value: "emergency", label: "Emergency Leave", desc: `${emergencyRemaining ?? "—"} of 7 remaining`, color: "#FB7185", bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.35)" },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, leave_type: opt.value }))}
                      disabled={opt.value === "emergency" && emergencyRemaining === 0}
                      className="relative p-4 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: form.leave_type === opt.value ? opt.border : "rgba(255,255,255,0.12)",
                        backgroundColor: form.leave_type === opt.value ? opt.bg : "rgba(255,255,255,0.03)",
                        opacity: opt.value === "emergency" && emergencyRemaining === 0 ? 0.5 : 1,
                        cursor: opt.value === "emergency" && emergencyRemaining === 0 ? "not-allowed" : "pointer",
                      }}>
                      <div className="text-xs font-semibold mb-0.5" style={{ color: form.leave_type === opt.value ? opt.color : ink }}>
                        {opt.label}
                      </div>
                      <div className="text-xs" style={{ color: mutedFaint }}>{opt.desc}</div>
                      {form.leave_type === opt.value && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: opt.color }}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#1B1630" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {advanceWarning && (
                  <div className="mt-3 px-4 py-3 rounded-lg text-xs" style={{ backgroundColor: "rgba(251,191,36,0.12)", color: "#FBBF24", borderLeft: "3px solid #FBBF24" }}>
                    <strong>Notice:</strong> Your selected start date is less than 2 days away — automatically switched to Emergency Leave.
                  </div>
                )}
              </div>

              {/* Half Day Toggle */}
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, is_half_day: !f.is_half_day }))}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ backgroundColor: form.is_half_day ? gold : "rgba(255,255,255,0.15)" }}>
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: form.is_half_day ? "translateX(20px)" : "translateX(0)" }} />
                </button>
                <span className="text-sm font-medium" style={{ color: ink }}>Half Day</span>
                {form.is_half_day && (
                  <div className="flex gap-2 ml-2">
                    {["morning", "afternoon"].map(p => (
                      <button key={p} type="button"
                        onClick={() => setForm(f => ({ ...f, half_day_period: p }))}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium capitalize"
                        style={{
                          borderColor: form.half_day_period === p ? gold : "rgba(255,255,255,0.14)",
                          backgroundColor: form.half_day_period === p ? "rgba(217,180,108,0.15)" : "transparent",
                          color: form.half_day_period === p ? gold : muted,
                        }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className={form.is_half_day ? "" : "grid grid-cols-2 gap-4"}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>
                    {form.is_half_day ? "Date" : "Start Date"}
                  </label>
                  <input type="date" value={form.start_date} min={today}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, start_date: val, end_date: f.end_date < val ? val : f.end_date }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                    required />
                </div>
                {!form.is_half_day && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>End Date</label>
                    <input type="date" value={form.end_date} min={form.start_date || today}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = gold)}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                      required />
                  </div>
                )}
              </div>

              {/* Holiday warning */}
              {holidayWarning && (
                <div className="px-4 py-3 rounded-lg text-xs" style={{ backgroundColor: "rgba(251,191,36,0.12)", color: "#FBBF24", borderLeft: "3px solid #FBBF24" }}>
                  <strong>Note:</strong> {holidayWarning} — public holiday already observed.
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>
                  Reason <span style={{ color: "#F87171" }}>*</span>
                </label>
                <textarea value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Provide a detailed reason for your leave request..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none resize-none glass-input"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                  required />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href="/dashboard"
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border"
                  style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                  Cancel
                </Link>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: gold, color: "#1B1630", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={glassCard}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#A78BFA" }}>Normal Leave</p>
            <p className="text-xs" style={{ color: muted }}>Apply at least <strong>2 days</strong> before. No annual limit. Half-day supported.</p>
          </div>
          <div className="p-4 rounded-xl" style={glassCard}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#FB7185" }}>Emergency Leave</p>
            <p className="text-xs" style={{ color: muted }}>Anytime. <strong>7 max</strong> per year. Half-day supported.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
