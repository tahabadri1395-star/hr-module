import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import LeaveActionButtons from "@/components/LeaveActionButtons";

interface LeaveWithEmployee {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  admin_id: number | null;
  admin_note: string | null;
  admin_action_at: string | null;
  admin_username: string | null;
  created_at: string;
  employee_name: string;
  employee_email: string;
  department: string | null;
  employee_code: string | null;
}

interface AllLeave {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  employee_name: string;
}

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "#FFF1F2", color: "#E11D48" },
  normal:    { label: "Normal",    bg: "#EEF2FF", color: "#4338CA" },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "Pending Admin",     bg: "#FFFBEB", color: "#B45309" },
  admin_approved:       { label: "Awaiting You",      bg: "#EFF6FF", color: "#1D4ED8" },
  approved:             { label: "Approved",          bg: "#F0FDF4", color: "#15803D" },
  admin_rejected:       { label: "Rejected by Admin", bg: "#FEF2F2", color: "#DC2626" },
  super_admin_rejected: { label: "Rejected by You",  bg: "#FEF2F2", color: "#DC2626" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dayCount(start: string, end: string) {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

export default async function SuperAdminPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "super_admin") redirect("/admin");

  const pendingResult = await query(`
    SELECT la.*,
      e.name as employee_name,
      e.email as employee_email,
      e.department,
      e.employee_code,
      a1.username as admin_username
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    LEFT JOIN hr_admins a1 ON la.admin_id = a1.id
    WHERE la.status = 'admin_approved'
    ORDER BY la.admin_action_at ASC
  `);
  const pendingLeaves = pendingResult.rows as LeaveWithEmployee[];

  const allResult = await query(`
    SELECT la.id, la.leave_type, la.start_date, la.end_date, la.status, la.created_at,
      e.name as employee_name
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    ORDER BY la.created_at DESC
    LIMIT 30
  `);
  const allLeaves = allResult.rows as AllLeave[];

  const stats = {
    awaitingYou: pendingLeaves.length,
    totalApproved: allLeaves.filter(l => l.status === "approved").length,
    totalRejected: allLeaves.filter(l => ["admin_rejected", "super_admin_rejected"].includes(l.status)).length,
    totalPendingAdmin: allLeaves.filter(l => l.status === "pending").length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Nav */}
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin/tasks" className="text-xs transition-colors hover:opacity-70" style={{ color: "#64748B" }}>Tasks</Link>
          <Link href="/admin/settings" className="text-xs transition-colors hover:opacity-70" style={{ color: "#64748B" }}>
            Settings
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs transition-colors hover:opacity-70" style={{ color: "#94A3B8" }}>
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Final Approval — Super Admin</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            These applications have been reviewed by the admin and are awaiting your final decision.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Awaiting Your Approval", value: stats.awaitingYou,       color: "#1D4ED8", bg: "#EFF6FF" },
            { label: "Pending Admin Review",   value: stats.totalPendingAdmin, color: "#B45309", bg: "#FFFBEB" },
            { label: "Fully Approved",         value: stats.totalApproved,     color: "#15803D", bg: "#F0FDF4" },
            { label: "Rejected (total)",       value: stats.totalRejected,     color: "#DC2626", bg: "#FEF2F2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Awaiting final approval */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#1E293B" }}>
          Awaiting Final Approval
          {pendingLeaves.length > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
              {pendingLeaves.length}
            </span>
          )}
        </h2>

        {pendingLeaves.length === 0 ? (
          <div className="bg-white rounded-xl border py-12 text-center mb-8" style={{ borderColor: "#E2E8F0" }}>
            <p className="font-medium text-sm mb-1" style={{ color: "#1E293B" }}>No applications pending final approval</p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>All admin-approved applications have been processed.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {pendingLeaves.map(leave => {
              const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
              const days = dayCount(leave.start_date, leave.end_date);
              return (
                <div key={leave.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                          {leave.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{leave.employee_name}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>
                            {leave.employee_code && <span>{leave.employee_code} · </span>}
                            {leave.employee_email}
                            {leave.department && <span> · {leave.department}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>
                          {lm.label} Leave
                        </span>
                        <span className="text-xs" style={{ color: "#64748B" }}>
                          {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
                          {days} day{days !== 1 ? "s" : ""}
                        </span>
                        {leave.admin_id && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                            Reviewed by Admin
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-lg mt-2" style={{ backgroundColor: "#F8FAFC" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#64748B" }}>Khidmat Guzar&apos;s Reason</p>
                        <p className="text-sm" style={{ color: "#1E293B" }}>{leave.reason}</p>
                      </div>

                      {leave.admin_note && (
                        <div className="p-3 rounded-lg mt-2" style={{ backgroundColor: "#EFF6FF" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "#1D4ED8" }}>Admin Note</p>
                          <p className="text-sm" style={{ color: "#1E293B" }}>{leave.admin_note}</p>
                        </div>
                      )}

                      <LeaveActionButtons leaveId={leave.id} role="super_admin" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: "#94A3B8" }}>Applied</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#64748B" }}>{formatDate(leave.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent history */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#1E293B" }}>Recent History</h2>
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          {allLeaves.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No applications yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {["Khidmat Guzar", "Type", "Dates", "Status", "Applied"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: "#94A3B8" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allLeaves.map((leave, i) => {
                    const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
                    const sm = STATUS_META[leave.status] ?? STATUS_META.pending;
                    return (
                      <tr key={leave.id} style={{ borderBottom: i < allLeaves.length - 1 ? "1px solid #F8FAFC" : undefined }}>
                        <td className="px-5 py-3.5 font-medium text-xs" style={{ color: "#1E293B" }}>{leave.employee_name}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>
                            {lm.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#64748B" }}>
                          {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#94A3B8" }}>{formatDate(leave.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t text-xs text-center" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
          <Link href="/admin/login" style={{ color: "#7C3AED" }}>Switch account</Link>
        </div>
      </div>
    </div>
  );
}
