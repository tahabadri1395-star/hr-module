"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AttendanceRecord {
  id: number; date: string; clock_in: string | null; clock_out: string | null;
  status: "present" | "late" | "absent" | "half_day"; notes: string | null; marked_by: string;
}

const STATUS_META = {
  present:  { label: "Present",   color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
  late:     { label: "Late",      color: "#B45309", bg: "#FFFBEB", dot: "#F59E0B" },
  absent:   { label: "Absent",    color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  half_day: { label: "Half Day",  color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
};

function fmtTime(t: string | null) { if (!t) return "—"; return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

export default function AttendancePage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState("");

  const monthStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    const res = await fetch(`/api/attendance?month=${monthStr}`);
    if (res.ok) {
      const d = await res.json();
      setTodayRecord(d.today);
      setRecords(d.records);
    }
  }, [monthStr]);

  useEffect(() => { load(); }, [load]);

  function getLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Your browser doesn't support location access, so clock in/out isn't available here."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Location access was denied. Please enable location for this site and try again."));
          } else {
            reject(new Error("Couldn't get your location. Please check your device's location settings and try again."));
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function clockAction(action: "clock_in" | "clock_out") {
    setActing(true); setMsg("");
    try {
      const { lat, lng } = await getLocation();
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lat, lng }),
      });
      if (res.ok) { load(); }
      else { const d = await res.json(); setMsg(d.error || "Failed."); }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActing(false);
    }
  }

  const recordMap: Record<string, AttendanceRecord> = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay    = getFirstDayOfMonth(currentMonth.year, currentMonth.month);

  const stats = {
    present:  records.filter(r => r.status === "present").length,
    late:     records.filter(r => r.status === "late").length,
    absent:   records.filter(r => r.status === "absent").length,
    half_day: records.filter(r => r.status === "half_day").length,
  };

  const prevMonth = () => setCurrentMonth(m => {
    if (m.month === 0) return { year: m.year - 1, month: 11 };
    return { year: m.year, month: m.month - 1 };
  });
  const nextMonth = () => setCurrentMonth(m => {
    if (m.month === 11) return { year: m.year + 1, month: 0 };
    return { year: m.year, month: m.month + 1 };
  });

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1E293B" }}>Attendance</h1>
        <p className="text-sm mb-6" style={{ color: "#64748B" }}>Track your daily attendance</p>

        {/* Clock In/Out Card */}
        <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94A3B8" }}>Today</p>
              <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{fmtDate(todayStr)}</p>
            </div>
            {todayRecord && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: STATUS_META[todayRecord.status].bg, color: STATUS_META[todayRecord.status].color }}>
                {STATUS_META[todayRecord.status].label}
              </span>
            )}
          </div>

          {todayRecord?.marked_by === "site_visit" && (
            <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
              🧳 You&apos;re auto-marked present today for an approved site visit/travel request. You can still clock in/out below to log your actual times — location won&apos;t be checked today.
            </div>
          )}

          {todayRecord ? (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#F0FDF4" }}>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Clock In</p>
                <p className="text-lg font-bold" style={{ color: "#16A34A" }}>{fmtTime(todayRecord.clock_in)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: todayRecord.clock_out ? "#F0FDF4" : "#F8FAFC" }}>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Clock Out</p>
                <p className="text-lg font-bold" style={{ color: todayRecord.clock_out ? "#16A34A" : "#CBD5E1" }}>{fmtTime(todayRecord.clock_out)}</p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center mb-3">
              <p className="text-sm" style={{ color: "#94A3B8" }}>You haven't clocked in yet</p>
            </div>
          )}

          {msg && <p className="text-xs mb-2" style={{ color: "#DC2626" }}>{msg}</p>}

          <div className="flex gap-3">
            {!todayRecord?.clock_in && (
              <button onClick={() => clockAction("clock_in")} disabled={acting}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: acting ? 0.7 : 1 }}>
                {acting ? "…" : "Clock In"}
              </button>
            )}
            {todayRecord?.clock_in && !todayRecord.clock_out && (
              <button onClick={() => clockAction("clock_out")} disabled={acting}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl"
                style={{ backgroundColor: "#ECFDF5", color: "#16A34A", border: "2px solid #BBF7D0", opacity: acting ? 0.7 : 1 }}>
                {acting ? "…" : "Clock Out"}
              </button>
            )}
            {todayRecord?.clock_out && (
              <div className="flex-1 text-center py-2.5">
                <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>Day complete</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {Object.entries(stats).map(([key, val]) => {
            const meta = STATUS_META[key as keyof typeof STATUS_META];
            return (
              <div key={key} className="rounded-2xl py-3 px-2 text-center" style={{ backgroundColor: meta.bg, border: `1px solid ${meta.dot}30` }}>
                <p className="text-xl font-bold" style={{ color: meta.color }}>{val}</p>
                <p className="text-xs mt-0.5" style={{ color: meta.color, opacity: 0.7 }}>{meta.label}</p>
              </div>
            );
          })}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{monthName}</p>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "#94A3B8" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const rec = recordMap[dateStr];
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              const meta = rec ? STATUS_META[rec.status] : null;
              return (
                <div key={day} className="aspect-square flex items-center justify-center rounded-xl relative text-xs font-medium"
                  style={{
                    backgroundColor: meta ? meta.bg : isToday ? "#EEF2FF" : "transparent",
                    color: meta ? meta.color : isToday ? "#4F46E5" : isFuture ? "#CBD5E1" : "#94A3B8",
                    border: isToday ? "2px solid #4F46E5" : "none",
                  }}>
                  {day}
                  {rec && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta!.dot }}></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dot }}></span>
                <span className="text-xs" style={{ color: "#64748B" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent records */}
        {records.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>This month</p>
            </div>
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {[...records].reverse().slice(0, 10).map(rec => {
                const meta = STATUS_META[rec.status];
                return (
                  <div key={rec.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{fmtDate(rec.date)}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                        {fmtTime(rec.clock_in)} {rec.clock_out ? `→ ${fmtTime(rec.clock_out)}` : "· not clocked out"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
