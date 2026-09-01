import { notFound } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "Pending",           bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  admin_approved:       { label: "Admin Approved",    bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  approved:             { label: "Approved",          bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  admin_rejected:       { label: "Rejected by Admin", bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  super_admin_rejected: { label: "Rejected by HR",   bg: "rgba(248,113,113,0.15)", color: "#F87171" },
};

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
  normal:    { label: "Normal",    bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dayCount(start: string, end: string, isHalfDay: boolean) {
  if (isHalfDay) return "0.5";
  return String(Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}

export default async function EmployeeLeavesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const leavesResult = await query(`
    SELECT la.* FROM hr_leave_applications la
    WHERE la.employee_id = $1
    ORDER BY la.created_at DESC
  `, [empId]);
  const leaves = leavesResult.rows;

  const currentYear = new Date().getFullYear();
  const countResult = await query(`
    SELECT COUNT(*) as used FROM hr_leave_applications
    WHERE employee_id = $1
      AND leave_type = 'emergency'
      AND status NOT IN ('admin_rejected','super_admin_rejected')
      AND start_date BETWEEN $2 AND $3
  `, [empId, `${currentYear}-01-01`, `${currentYear}-12-31`]);
  const emergencyUsed = parseInt(countResult.rows[0].used, 10);

  const approved = leaves.filter(l => l.status === "approved").length;
  const pending  = leaves.filter(l => l.status === "pending").length;

  return (
    <div>
      {/* Stats */}
      <div className="rounded-xl p-5 mb-6 flex items-center gap-6" style={glassCard}>
        <div className="grid grid-cols-3 gap-6 text-center flex-1">
          {[
            { label: "Total", value: leaves.length, color: gold },
            { label: "Approved", value: approved, color: "#4ADE80" },
            { label: "Pending", value: pending, color: "#D9B46C" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="pl-6 border-l text-xs shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span style={{ color: muted }}>Emergency used this year:</span>{" "}
          <span className="font-semibold" style={{ color: emergencyUsed >= 7 ? "#FB7185" : "#93C5FD" }}>
            {emergencyUsed} / 7
          </span>
        </div>
      </div>

      {/* Leave history table */}
      <div className="rounded-xl overflow-hidden" style={glassCard}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: ink }}>All Leave Applications</h2>
        </div>

        {leaves.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: mutedFaint }}>No applications on record.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Type", "Dates", "Duration", "Status", "Applied", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: mutedFaint }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave, i) => {
                  const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
                  const sm = STATUS_META[leave.status] ?? STATUS_META.pending;
                  const days = dayCount(leave.start_date, leave.end_date, !!leave.is_half_day);
                  return (
                    <tr key={leave.id} style={{ borderBottom: i < leaves.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>
                          {lm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: muted }}>
                        {formatDate(leave.start_date)}{!leave.is_half_day ? ` → ${formatDate(leave.end_date)}` : ""}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: muted }}>
                        {leave.is_half_day ? `½ day · ${leave.half_day_period ?? ""}` : `${days} day${days !== "1" ? "s" : ""}`}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: mutedFaint }}>{formatDate(leave.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/leave/${leave.id}`} className="text-xs font-medium" style={{ color: gold }}>
                          Slip
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
