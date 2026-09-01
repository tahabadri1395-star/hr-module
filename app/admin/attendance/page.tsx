"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getISTDateTime } from "@/lib/time";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface AttendanceRecord {
  id: number; employee_id: number; employee_name: string; department: string | null;
  employee_code: string | null; date: string; clock_in: string | null; clock_out: string | null;
  status: "present" | "late" | "absent" | "half_day"; notes: string | null; marked_by: string;
  clock_in_location_name: string | null; clock_out_location_name: string | null;
  clock_in_lat: string | null; clock_in_lng: string | null;
}
interface Summary {
  id: number; name: string; department: string | null;
  present: string; late: string; absent: string; half_day: string; total_marked: string;
}
interface Employee { id: number; name: string; department: string | null; }

const STATUS_META = {
  present:  { label: "Present",  color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  late:     { label: "Late",     color: "#D9B46C", bg: "rgba(217,180,108,0.15)" },
  absent:   { label: "Absent",   color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  half_day: { label: "Half Day", color: "#93C5FD", bg: "rgba(96,165,250,0.15)" },
};

function fmtTime(t: string | null) { if (!t) return "—"; return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

export default function AdminAttendancePage() {
  const today = getISTDateTime().date;
  const monthStart = today.slice(0, 7) + "-01";

  const [records, setRecords]   = useState<AttendanceRecord[]>([]);
  const [summary, setSummary]   = useState<Summary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [from, setFrom]         = useState(monthStart);
  const [to, setTo]             = useState(today);
  const [empFilter, setEmpFilter] = useState("");
  const [view, setView]         = useState<"records" | "summary">("summary");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [form, setForm]         = useState({ employee_id: "", date: today, status: "present", clock_in: "", clock_out: "", notes: "" });

  const load = useCallback(async () => {
    const params = new URLSearchParams({ from, to });
    if (empFilter) params.set("employee_id", empFilter);
    const res = await fetch(`/api/admin/attendance?${params}`);
    if (res.ok) { const d = await res.json(); setRecords(d.records); setSummary(d.summary); }
  }, [from, to, empFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin/employees").then(r => r.json()).then(d => setEmployees(d.employees ?? []));
  }, []);

  async function save() {
    if (!form.employee_id || !form.date || !form.status) { setMsg("Employee, date and status required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, employee_id: parseInt(form.employee_id), clock_in: form.clock_in || null, clock_out: form.clock_out || null }),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); load(); }
    else { const d = await res.json(); setMsg(d.error || "Failed."); }
  }

  async function del(id: number) {
    if (!confirm("Delete this attendance record?")) return;
    await fetch(`/api/admin/attendance/${id}`, { method: "DELETE" });
    load();
  }

  const presentCount = records.filter(r => r.status === "present").length;
  const lateCount    = records.filter(r => r.status === "late").length;
  const absentCount  = records.filter(r => r.status === "absent").length;

  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.06)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: "#F59E0B" }}>
            <img src="/estate-mark.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Time & Attendance</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Monitor KG attendance and clock-in records</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + Mark Attendance
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Present", value: presentCount, color: "#4ADE80" },
            { label: "Late",    value: lateCount,    color: "#D9B46C" },
            { label: "Absent",  value: absentCount,  color: "#F87171" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={glassCard}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mark form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-5" style={{ ...glassCard, border: "1px solid rgba(217,180,108,0.4)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: ink }}>Mark Attendance</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Khidmat Guzar *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                  <option value="">Select…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Status *</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Clock In</label>
                <input type="time" value={form.clock_in} onChange={e => setForm(f => ({ ...f, clock_in: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Clock Out</label>
                <input type="time" value={form.clock_out} onChange={e => setForm(f => ({ ...f, clock_out: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border outline-none glass-input" style={inputStyle} />
          <span className="text-xs self-center" style={{ color: mutedFaint }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border outline-none glass-input" style={inputStyle} />
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border outline-none glass-input" style={inputStyle}>
            <option value="">All KGs</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="flex gap-1 p-1 rounded-xl" style={glassPill}>
            {(["summary", "records"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize"
                style={{ backgroundColor: view === v ? gold : "transparent", color: view === v ? "#1B1630" : muted }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Summary view */}
        {view === "summary" && (
          <div className="rounded-2xl overflow-hidden" style={glassCard}>
            <div className="grid grid-cols-7 px-5 py-3 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: muted }}>
              <div className="col-span-2">Khidmat Guzar</div>
              <div className="text-center" style={{ color: "#4ADE80" }}>Present</div>
              <div className="text-center" style={{ color: "#D9B46C" }}>Late</div>
              <div className="text-center" style={{ color: "#F87171" }}>Absent</div>
              <div className="text-center" style={{ color: "#93C5FD" }}>Half Day</div>
              <div className="text-center">Total</div>
            </div>
            {summary.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm" style={{ color: mutedFaint }}>No records for this period</p></div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {summary.map(row => (
                  <div key={row.id} className="grid grid-cols-7 px-5 py-3 items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-semibold" style={{ color: ink }}>{row.name}</p>
                      {row.department && <p className="text-xs" style={{ color: mutedFaint }}>{row.department}</p>}
                    </div>
                    <div className="text-center text-sm font-bold" style={{ color: "#4ADE80" }}>{row.present}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#D9B46C" }}>{row.late}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#F87171" }}>{row.absent}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#93C5FD" }}>{row.half_day}</div>
                    <div className="text-center text-sm" style={{ color: muted }}>{row.total_marked}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Records view */}
        {view === "records" && (
          <div className="space-y-2">
            {records.length === 0 ? (
              <div className="rounded-2xl py-12 text-center" style={glassCard}>
                <p className="text-sm" style={{ color: mutedFaint }}>No records for this period</p>
              </div>
            ) : records.map(rec => {
              const meta = STATUS_META[rec.status];
              return (
                <div key={rec.id} className="rounded-2xl px-5 py-3.5 flex items-center gap-3" style={glassCard}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold" style={{ color: ink }}>{rec.employee_name}</p>
                      {rec.department && <span className="text-xs px-1.5 py-0.5 rounded" style={glassPill}>{rec.department}</span>}
                    </div>
                    <p className="text-xs" style={{ color: mutedFaint }}>
                      {fmtDate(rec.date)} · {fmtTime(rec.clock_in)} {rec.clock_out ? `→ ${fmtTime(rec.clock_out)}` : ""}
                      {rec.marked_by !== "self" && rec.marked_by !== "site_visit" ? ` · marked by ${rec.marked_by}` : ""}
                    </p>
                    {rec.marked_by === "site_visit" && (
                      <p className="text-xs mt-0.5" style={{ color: "#C4B5FD" }}>🧳 Auto-marked — approved site visit/travel</p>
                    )}
                    {rec.marked_by === "self" && (
                      <p className="text-xs mt-0.5" style={{ color: rec.clock_in_location_name ? "#4ADE80" : "#F87171" }}>
                        📍 {rec.clock_in_location_name || (rec.clock_in_lat ? "Location recorded, no site configured" : "No location recorded")}
                      </p>
                    )}
                    {rec.notes && <p className="text-xs mt-0.5 italic" style={{ color: mutedFaint }}>{rec.notes}</p>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                  <button onClick={() => del(rec.id)} className="text-xs px-2 py-1 rounded-lg border shrink-0" style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>Del</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
