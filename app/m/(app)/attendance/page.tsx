import { getEmployeeFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import ClockInOutCard from "@/components/mobile/ClockInOutCard";
import { bg, ink, muted, neuRaised, neuInset } from "@/lib/mobile-theme";

const STATUS_COLOR: Record<string, string> = {
  present: "#16A34A",
  late: "#B45309",
  absent: "#DC2626",
  half_day: "#2563EB",
};
const STATUS_LABEL: Record<string, string> = {
  present: "Present", late: "Late", absent: "Absent", half_day: "Half Day",
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

      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
        <div className="px-4 py-3.5">
          <h2 className="text-sm font-bold" style={{ color: ink }}>Recent Attendance</h2>
        </div>
        {records.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: muted }}>No records yet.</div>
        ) : (
          <div className="px-2 pb-2 space-y-1.5">
            {records.map(r => {
              const color = STATUS_COLOR[r.status] ?? STATUS_COLOR.present;
              return (
                <div key={r.id} className="px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: ink }}>{fmtDate(r.date)}</p>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>
                      {fmtTime(r.clock_in)} {r.clock_out ? `→ ${fmtTime(r.clock_out)}` : ""}
                    </p>
                    {r.marked_by === "site_visit" && <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>🧳 Site visit</p>}
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: bg, boxShadow: neuInset, color }}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
