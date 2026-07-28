import { getEmployeeFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import ClockInOutCard from "@/components/mobile/ClockInOutCard";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  present:  { label: "Present",  bg: "#F0FDF4", color: "#16A34A" },
  late:     { label: "Late",     bg: "#FFFBEB", color: "#B45309" },
  absent:   { label: "Absent",   bg: "#FEF2F2", color: "#DC2626" },
  half_day: { label: "Half Day", bg: "#EFF6FF", color: "#2563EB" },
};

function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function fmtTime(t: string | null) { if (!t) return "—"; return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

export default async function MobileAttendancePage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/m/login");

  const result = await query(`SELECT * FROM hr_attendance WHERE employee_id=$1 ORDER BY date DESC LIMIT 30`, [employee.id]);
  const records = result.rows;

  return (
    <div className="space-y-5 pb-2">
      <ClockInOutCard />

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Recent Attendance</h2>
        </div>
        {records.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No records yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {records.map(r => {
              const sm = STATUS_META[r.status] ?? STATUS_META.present;
              return (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{fmtDate(r.date)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {fmtTime(r.clock_in)} {r.clock_out ? `→ ${fmtTime(r.clock_out)}` : ""}
                    </p>
                    {r.marked_by === "site_visit" && <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>🧳 Site visit</p>}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
