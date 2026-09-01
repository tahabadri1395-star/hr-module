import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { ink, muted, mutedFaint, glassCard } from "@/lib/desktop-theme";

const KIND_META: Record<string, { icon: string; label: (r: any) => string }> = {
  leave:   { icon: "🗓️", label: r => `Leave request · ${r.label}` },
  task:    { icon: "✅", label: r => `Task · ${r.label}` },
  travel:  { icon: "🧳", label: r => `Travel · ${r.label}` },
  expense: { icon: "🧾", label: r => `Expense claim · ${r.label}` },
  arz:     { icon: "📩", label: r => `Arz · ${r.label}` },
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:              { bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  admin_approved:       { bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  approved:             { bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  admin_rejected:       { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  super_admin_rejected: { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  rejected:             { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  ongoing:              { bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  completed:            { bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  open:                 { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  in_progress:          { bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  resolved:             { bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  closed:               { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
};

function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtAmount(a: number) { return `₹${a.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default async function EmployeeOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const [
    attendanceResult,
    leavesResult,
    tasksResult,
    travelResult,
    expensesResult,
    arzResult,
    assetsResult,
    murasalatResult,
    activityResult,
  ] = await Promise.all([
    query(`SELECT status, COUNT(*) FROM hr_attendance WHERE employee_id = $1 AND date >= TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'YYYY-MM-DD') GROUP BY status`, [empId]),
    query(`SELECT status, COUNT(*) FROM hr_leave_applications WHERE employee_id = $1 GROUP BY status`, [empId]),
    query(`SELECT status, COUNT(*) FROM hr_tasks WHERE assigned_to = $1 GROUP BY status`, [empId]),
    query(`SELECT status, COUNT(*) FROM hr_travel_requests WHERE employee_id = $1 GROUP BY status`, [empId]),
    query(`SELECT status, COALESCE(SUM(amount),0) as total FROM hr_expenses WHERE employee_id = $1 GROUP BY status`, [empId]),
    query(`SELECT status, COUNT(*) FROM hr_arz WHERE employee_id = $1 GROUP BY status`, [empId]),
    query(`SELECT COUNT(*) FROM hr_asset_assignments WHERE employee_id = $1 AND status = 'active'`, [empId]),
    query(`
      SELECT COUNT(*) as unread FROM hr_murasalat m
      LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id = m.id AND mr.employee_id = $1
      WHERE (m.department IS NULL OR m.department = (SELECT department FROM hr_employees WHERE id = $1)) AND mr.id IS NULL
    `, [empId]),
    query(`
      SELECT 'leave' as kind, leave_type as label, status, created_at FROM hr_leave_applications WHERE employee_id = $1
      UNION ALL
      SELECT 'task' as kind, title as label, status, created_at FROM hr_tasks WHERE assigned_to = $1
      UNION ALL
      SELECT 'travel' as kind, destination as label, status, created_at FROM hr_travel_requests WHERE employee_id = $1
      UNION ALL
      SELECT 'expense' as kind, title as label, status, created_at FROM hr_expenses WHERE employee_id = $1
      UNION ALL
      SELECT 'arz' as kind, subject as label, status, created_at FROM hr_arz WHERE employee_id = $1
      ORDER BY created_at DESC LIMIT 8
    `, [empId]),
  ]);

  const attByStatus: Record<string, number> = {};
  attendanceResult.rows.forEach(r => { attByStatus[r.status] = parseInt(r.count, 10); });
  const attTotal = Object.values(attByStatus).reduce((s, n) => s + n, 0);
  const attendanceRate = attTotal > 0
    ? Math.round(((attByStatus.present ?? 0) + (attByStatus.late ?? 0) + 0.5 * (attByStatus.half_day ?? 0)) / attTotal * 100)
    : null;

  const pendingLeaves = leavesResult.rows.find(r => r.status === "pending")?.count ?? 0;
  const activeTasks = tasksResult.rows.filter(r => r.status !== "completed").reduce((s, r) => s + parseInt(r.count, 10), 0);
  const pendingTravel = travelResult.rows.find(r => r.status === "pending")?.count ?? 0;
  const totalReimbursed = parseFloat(expensesResult.rows.find(r => r.status === "approved")?.total ?? "0");
  const openArz = arzResult.rows.filter(r => ["open", "in_progress"].includes(r.status)).reduce((s, r) => s + parseInt(r.count, 10), 0);
  const assignedAssets = parseInt(assetsResult.rows[0]?.count ?? "0", 10);
  const unreadCirculars = parseInt(murasalatResult.rows[0]?.unread ?? "0", 10);

  const tiles = [
    { label: "Attendance (30d)", value: attendanceRate !== null ? `${attendanceRate}%` : "—", color: attendanceRate === null ? mutedFaint : attendanceRate >= 90 ? "#4ADE80" : attendanceRate >= 75 ? "#D9B46C" : "#F87171" },
    { label: "Pending Leave", value: pendingLeaves, color: parseInt(String(pendingLeaves)) > 0 ? "#D9B46C" : mutedFaint },
    { label: "Active Tasks", value: activeTasks, color: activeTasks > 0 ? "#93C5FD" : mutedFaint },
    { label: "Pending Travel", value: pendingTravel, color: parseInt(String(pendingTravel)) > 0 ? "#D9B46C" : mutedFaint },
    { label: "Unread Circulars", value: unreadCirculars, color: unreadCirculars > 0 ? "#F87171" : mutedFaint },
    { label: "Open Arz", value: openArz, color: openArz > 0 ? "#F87171" : mutedFaint },
    { label: "Assets Assigned", value: assignedAssets, color: assignedAssets > 0 ? "#C4B5FD" : mutedFaint },
    { label: "Total Reimbursed", value: fmtAmount(totalReimbursed), color: "#4ADE80" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl px-4 py-4" style={glassCard}>
            <p className="text-xl font-bold" style={{ color: t.color }}>{t.value}</p>
            <p className="text-xs mt-1" style={{ color: muted }}>{t.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={glassCard}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: ink }}>Recent Activity</h2>
        </div>
        {activityResult.rows.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: mutedFaint }}>No activity recorded yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {activityResult.rows.map((r, i) => {
              const meta = KIND_META[r.kind];
              const sm = STATUS_COLOR[r.status] ?? { bg: "rgba(255,255,255,0.08)", color: muted };
              return (
                <div key={i} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: ink }}>{meta.label(r)}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0" style={{ backgroundColor: sm.bg, color: sm.color }}>
                    {r.status.replace(/_/g, " ")}
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
