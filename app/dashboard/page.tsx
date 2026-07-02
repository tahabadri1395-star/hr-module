import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmployeeFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";

interface LeaveApp {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  admin_note: string | null;
  super_admin_note: string | null;
  admin_action_at: string | null;
  super_admin_action_at: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "Pending",           bg: "#FFFBEB", color: "#B45309" },
  admin_approved:       { label: "Admin Approved",    bg: "#EFF6FF", color: "#1D4ED8" },
  approved:             { label: "Approved",          bg: "#F0FDF4", color: "#15803D" },
  admin_rejected:       { label: "Rejected by Admin", bg: "#FEF2F2", color: "#DC2626" },
  super_admin_rejected: { label: "Rejected by HR",   bg: "#FEF2F2", color: "#DC2626" },
};

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "#FFF1F2", color: "#E11D48" },
  normal:    { label: "Normal",    bg: "#EEF2FF", color: "#4338CA" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/login");

  const leavesResult = await query(`
    SELECT la.* FROM hr_leave_applications la
    WHERE la.employee_id = $1
    ORDER BY la.created_at DESC
  `, [employee.id]);
  const leaves = leavesResult.rows as LeaveApp[];

  const currentYear = new Date().getFullYear();
  const countResult = await query(`
    SELECT COUNT(*) as emergency_used FROM hr_leave_applications
    WHERE employee_id = $1
      AND leave_type = 'emergency'
      AND status NOT IN ('admin_rejected','super_admin_rejected')
      AND start_date BETWEEN $2 AND $3
  `, [employee.id, `${currentYear}-01-01`, `${currentYear}-12-31`]);
  const emergency_used = parseInt(countResult.rows[0].emergency_used, 10);
  const emergencyRemaining = Math.max(0, 7 - emergency_used);

  const pendingCount  = leaves.filter(l => l.status === "pending").length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Nav */}
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M9 13h6M9 16h4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
            Khidmat Guzar
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm hidden sm:block" style={{ color: "#64748B" }}>
            {employee.name}
          </span>
          <Link href="/apply"
            className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            + Apply Leave
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs transition-colors hover:opacity-70" style={{ color: "#94A3B8" }}>
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Welcome back, {employee.name.split(" ")[0]}</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Track and manage your leave applications as a Khidmat Guzar</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applied",       value: leaves.length,       color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Pending",             value: pendingCount,        color: "#B45309", bg: "#FFFBEB" },
            { label: "Approved",            value: approvedCount,       color: "#15803D", bg: "#F0FDF4" },
            { label: "Emergency Remaining", value: emergencyRemaining,  color: "#E11D48", bg: "#FFF1F2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
              {s.label === "Emergency Remaining" && (
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>of 7 this year</p>
              )}
            </div>
          ))}
        </div>

        {/* Emergency leave banner */}
        {emergencyRemaining === 0 && (
          <div className="mb-6 px-5 py-4 rounded-xl border"
            style={{ backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }}>
            <p className="text-sm font-medium mb-0.5" style={{ color: "#9F1239" }}>Emergency Leave Limit Reached</p>
            <p className="text-xs" style={{ color: "#BE123C" }}>
              You have used all 7 emergency leave allowances for {currentYear}. Only normal leave (minimum 2 days advance notice) is available.
            </p>
          </div>
        )}

        {/* Leave history */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
            <h2 className="font-semibold text-sm" style={{ color: "#1E293B" }}>Leave Applications</h2>
            <span className="text-xs" style={{ color: "#94A3B8" }}>{leaves.length} total</span>
          </div>

          {leaves.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>No applications yet</p>
              <p className="text-xs mb-4" style={{ color: "#94A3B8" }}>Submit your first leave application</p>
              <Link href="/apply"
                className="inline-block text-xs font-medium px-5 py-2.5 rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {leaves.map(leave => {
                const sm = STATUS_META[leave.status] ?? STATUS_META.pending;
                const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
                return (
                  <div key={leave.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: lm.bg, color: lm.color }}>
                            {lm.label}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1" style={{ color: "#1E293B" }}>
                          {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                        </p>
                        <p className="text-xs mt-1 truncate" style={{ color: "#64748B" }}>{leave.reason}</p>
                        {leave.admin_note && (
                          <p className="text-xs mt-1.5 italic" style={{ color: "#94A3B8" }}>
                            Admin note: {leave.admin_note}
                          </p>
                        )}
                        {leave.super_admin_note && (
                          <p className="text-xs mt-1 italic" style={{ color: "#94A3B8" }}>
                            HR note: {leave.super_admin_note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                          {formatDate(leave.created_at)}
                        </p>
                        {leave.status === "admin_approved" && (
                          <p className="text-xs mt-1" style={{ color: "#1D4ED8" }}>Awaiting HR approval</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
