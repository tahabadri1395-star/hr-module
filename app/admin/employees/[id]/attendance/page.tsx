import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  present:  { label: "Present",  bg: "#F0FDF4", color: "#16A34A" },
  late:     { label: "Late",     bg: "#FFFBEB", color: "#B45309" },
  absent:   { label: "Absent",   bg: "#FEF2F2", color: "#DC2626" },
  half_day: { label: "Half Day", bg: "#EFF6FF", color: "#2563EB" },
};

function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(t: string | null) { if (!t) return "—"; return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

export default async function EmployeeAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const result = await query(
    `SELECT * FROM hr_attendance WHERE employee_id = $1 ORDER BY date DESC LIMIT 90`,
    [empId]
  );
  const records = result.rows;

  const present  = records.filter(r => r.status === "present").length;
  const late     = records.filter(r => r.status === "late").length;
  const absent   = records.filter(r => r.status === "absent").length;
  const halfDay  = records.filter(r => r.status === "half_day").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Present",  value: present,  color: "#16A34A" },
          { label: "Late",     value: late,     color: "#B45309" },
          { label: "Absent",   value: absent,   color: "#DC2626" },
          { label: "Half Day", value: halfDay,  color: "#2563EB" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-4 py-3 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Recent Attendance (last 90 records)</h2>
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No attendance records on file.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {records.map(r => {
              const sm = STATUS_META[r.status] ?? STATUS_META.present;
              return (
                <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{fmtDate(r.date)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {fmtTime(r.clock_in)} {r.clock_out ? `→ ${fmtTime(r.clock_out)}` : ""}
                      {r.marked_by && r.marked_by !== "self" ? ` · marked by ${r.marked_by}` : ""}
                    </p>
                    {r.marked_by === "self" && (
                      <p className="text-xs mt-0.5" style={{ color: r.clock_in_location_name ? "#16A34A" : "#94A3B8" }}>
                        📍 {r.clock_in_location_name || "No registered site matched"}
                      </p>
                    )}
                    {r.marked_by === "site_visit" && (
                      <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>🧳 Auto-marked — approved site visit/travel</p>
                    )}
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
