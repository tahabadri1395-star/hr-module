"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Record {
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
  present:  { label: "Present",  color: "#16A34A", bg: "#F0FDF4" },
  late:     { label: "Late",     color: "#B45309", bg: "#FFFBEB" },
  absent:   { label: "Absent",   color: "#DC2626", bg: "#FEF2F2" },
  half_day: { label: "Half Day", color: "#2563EB", bg: "#EFF6FF" },
};

function fmtTime(t: string | null) { if (!t) return "—"; return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

export default function AdminAttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [records, setRecords]   = useState<Record[]>([]);
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

  const totalDays = records.length ? [...new Set(records.map(r => r.date))].length : 0;
  const presentCount = records.filter(r => r.status === "present").length;
  const lateCount    = records.filter(r => r.status === "late").length;
  const absentCount  = records.filter(r => r.status === "absent").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto sticky top-0 z-20" style={{ backgroundColor: "#0F172A" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-sm text-white">HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
      </nav>

      <div className="px-6 pb-6 pt-2 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Time & Attendance</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Monitor KG attendance and clock-in records</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + Mark Attendance
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Present", value: presentCount, color: "#4ADE80" },
            { label: "Late",    value: lateCount,    color: "#FBBF24" },
            { label: "Absent",  value: absentCount,  color: "#F87171" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "#1E293B" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-6xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Mark form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>Mark Attendance</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Khidmat Guzar *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="">Select…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Status *</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Clock In</label>
                <input type="time" value={form.clock_in} onChange={e => setForm(f => ({ ...f, clock_in: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Clock Out</label>
                <input type="time" value={form.clock_out} onChange={e => setForm(f => ({ ...f, clock_out: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border bg-white outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
          <span className="text-xs self-center" style={{ color: "#94A3B8" }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border bg-white outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border bg-white outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
            <option value="">All KGs</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="flex gap-1 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
            {(["summary", "records"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize"
                style={{ backgroundColor: view === v ? "#0F172A" : "transparent", color: view === v ? "white" : "#64748B" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Summary view */}
        {view === "summary" && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="grid grid-cols-7 px-5 py-3 text-xs font-semibold" style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #F1F5F9", color: "#64748B" }}>
              <div className="col-span-2">Khidmat Guzar</div>
              <div className="text-center" style={{ color: "#16A34A" }}>Present</div>
              <div className="text-center" style={{ color: "#B45309" }}>Late</div>
              <div className="text-center" style={{ color: "#DC2626" }}>Absent</div>
              <div className="text-center" style={{ color: "#2563EB" }}>Half Day</div>
              <div className="text-center">Total</div>
            </div>
            {summary.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm" style={{ color: "#94A3B8" }}>No records for this period</p></div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {summary.map(row => (
                  <div key={row.id} className="grid grid-cols-7 px-5 py-3 items-center hover:bg-gray-50">
                    <div className="col-span-2">
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{row.name}</p>
                      {row.department && <p className="text-xs" style={{ color: "#94A3B8" }}>{row.department}</p>}
                    </div>
                    <div className="text-center text-sm font-bold" style={{ color: "#16A34A" }}>{row.present}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#B45309" }}>{row.late}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#DC2626" }}>{row.absent}</div>
                    <div className="text-center text-sm font-bold" style={{ color: "#2563EB" }}>{row.half_day}</div>
                    <div className="text-center text-sm" style={{ color: "#64748B" }}>{row.total_marked}</div>
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
              <div className="bg-white rounded-2xl py-12 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
                <p className="text-sm" style={{ color: "#94A3B8" }}>No records for this period</p>
              </div>
            ) : records.map(rec => {
              const meta = STATUS_META[rec.status];
              return (
                <div key={rec.id} className="bg-white rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{rec.employee_name}</p>
                      {rec.department && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>{rec.department}</span>}
                    </div>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      {fmtDate(rec.date)} · {fmtTime(rec.clock_in)} {rec.clock_out ? `→ ${fmtTime(rec.clock_out)}` : ""}
                      {rec.marked_by !== "self" && rec.marked_by !== "site_visit" ? ` · marked by ${rec.marked_by}` : ""}
                    </p>
                    {rec.marked_by === "site_visit" && (
                      <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>🧳 Auto-marked — approved site visit/travel</p>
                    )}
                    {rec.marked_by === "self" && (
                      <p className="text-xs mt-0.5" style={{ color: rec.clock_in_location_name ? "#16A34A" : "#DC2626" }}>
                        📍 {rec.clock_in_location_name || (rec.clock_in_lat ? "Location recorded, no site configured" : "No location recorded")}
                      </p>
                    )}
                    {rec.notes && <p className="text-xs mt-0.5 italic" style={{ color: "#94A3B8" }}>{rec.notes}</p>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                  <button onClick={() => del(rec.id)} className="text-xs px-2 py-1 rounded-lg border shrink-0" style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>Del</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
