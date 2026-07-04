import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import LeaveActionButtons from "@/components/LeaveActionButtons";

interface LeaveWithEmployee {
  id: number; leave_type: string; start_date: string; end_date: string;
  reason: string; status: string; admin_id: number | null; admin_note: string | null;
  admin_action_at: string | null; created_at: string;
  employee_name: string; employee_email: string; department: string | null; employee_code: string | null;
}

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "#FFF1F2", color: "#E11D48" },
  normal:    { label: "Normal",    bg: "#EEF2FF", color: "#4338CA" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function days(a: string, b: string) { return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1; }

export default async function SuperAdminPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "super_admin") redirect("/admin");

  const [pendingRes, statsRes] = await Promise.all([
    query(`SELECT la.*, e.name as employee_name, e.email as employee_email, e.department, e.employee_code, a1.username as admin_username FROM hr_leave_applications la JOIN hr_employees e ON la.employee_id=e.id LEFT JOIN hr_admins a1 ON la.admin_id=a1.id WHERE la.status='admin_approved' ORDER BY la.admin_action_at ASC`),
    query(`SELECT
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status='admin_approved') as awaiting,
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status='pending') as pending_admin,
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status='approved') as approved,
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status IN ('admin_rejected','super_admin_rejected')) as rejected,
      (SELECT COUNT(*) FROM hr_employees WHERE active=1) as total_kgs,
      (SELECT COUNT(*) FROM hr_tasks WHERE status!='completed') as open_tasks,
      (SELECT COUNT(*) FROM hr_travel_requests WHERE status='pending') as pending_travel,
      (SELECT COUNT(*) FROM hr_murasalat) as total_mura,
      (SELECT COUNT(*) FROM hr_arz WHERE status IN ('open','in_progress')) as open_arz,
      (SELECT COUNT(*) FROM hr_polls WHERE status='active') as active_polls,
      (SELECT COUNT(*) FROM hr_assets) as total_assets,
      (SELECT COUNT(*) FROM hr_documents) as total_docs,
      (SELECT COUNT(*) FROM hr_courses WHERE status='active') as active_courses,
      (SELECT COUNT(*) FROM hr_reimbursements WHERE status='pending') as pending_reimb,
      (SELECT COUNT(DISTINCT employee_id) FROM hr_attendance WHERE date=CURRENT_DATE::text) as clocked_today`),
  ]);

  const pendingLeaves = pendingRes.rows as LeaveWithEmployee[];
  const s = statsRes.rows[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Emerald top header - distinct from both KG (purple) and Admin (dark navy) */}
      <div style={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)" }}>
        <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-sm text-white">HR Module</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-white/80" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>Super Admin</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/admin/leaves"    className="text-xs text-white/60 hover:text-white">Leaves</Link>
            <Link href="/admin/tasks"     className="text-xs text-white/60 hover:text-white">Tasks</Link>
            <Link href="/admin/murasalat" className="text-xs text-white/60 hover:text-white">Murasalat</Link>
            <Link href="/admin/arz"       className="text-xs text-white/60 hover:text-white">Arz</Link>
            <Link href="/admin/polls"     className="text-xs text-white/60 hover:text-white">Polls</Link>
            <Link href="/admin/assets"    className="text-xs text-white/60 hover:text-white">Assets</Link>
            <Link href="/admin/documents" className="text-xs text-white/60 hover:text-white">Documents</Link>
            <Link href="/admin/lms"        className="text-xs text-white/60 hover:text-white">L&D</Link>
            <Link href="/admin/attendance" className="text-xs text-white/60 hover:text-white">Attendance</Link>
            <Link href="/admin/travel"    className="text-xs text-white/60 hover:text-white">Travel</Link>
            <Link href="/admin/settings"  className="text-xs text-white/60 hover:text-white">Settings</Link>
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="text-xs text-white/40 hover:text-white/70">Sign Out</button>
            </form>
          </div>
        </nav>

        {/* Executive header */}
        <div className="px-6 pb-10 pt-2 max-w-6xl mx-auto">
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">Executive Overview</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Final authority — HR Management System</p>

          {/* Wide stat strip */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-6">
            {[
              { label: "Awaiting You",    value: parseInt(s.awaiting, 10),       color: "#34D399", highlight: true },
              { label: "Pending Admin",   value: parseInt(s.pending_admin, 10),  color: "#FCD34D", highlight: false },
              { label: "Fully Approved",  value: parseInt(s.approved, 10),       color: "#6EE7B7", highlight: false },
              { label: "Rejected",        value: parseInt(s.rejected, 10),       color: "#FCA5A5", highlight: false },
              { label: "Active KGs",      value: parseInt(s.total_kgs, 10),      color: "rgba(255,255,255,0.7)", highlight: false },
              { label: "Open Tasks",      value: parseInt(s.open_tasks, 10),     color: "rgba(255,255,255,0.7)", highlight: false },
              { label: "Travel Pending",  value: parseInt(s.pending_travel, 10), color: "rgba(255,255,255,0.7)", highlight: false },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl px-3 py-3 text-center"
                style={{ backgroundColor: stat.highlight ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)", border: stat.highlight ? "1px solid rgba(52,211,153,0.4)" : "none" }}>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* White body */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* All modules grid */}
        <div className="grid grid-cols-4 sm:grid-cols-11 gap-2 mb-8">
          {[
            { href: "/admin/leaves",     label: "Leaves",      badge: parseInt(s.awaiting,10) + parseInt(s.pending_admin,10), color: "#F59E0B" },
            { href: "/admin/tasks",      label: "Tasks",       badge: parseInt(s.open_tasks,10),      color: "#3B82F6" },
            { href: "/admin/travel",     label: "Travel",      badge: parseInt(s.pending_travel,10) + parseInt(s.pending_reimb,10), color: "#10B981" },
            { href: "/admin/murasalat",  label: "Murasalat",  badge: parseInt(s.total_mura,10),       color: "#8B5CF6" },
            { href: "/admin/arz",        label: "Arz",         badge: parseInt(s.open_arz,10),         color: "#EA580C" },
            { href: "/admin/polls",      label: "Polls",       badge: parseInt(s.active_polls,10),     color: "#06B6D4" },
            { href: "/admin/assets",     label: "Assets",      badge: parseInt(s.total_assets,10),     color: "#B45309" },
            { href: "/admin/documents",  label: "Documents",   badge: parseInt(s.total_docs,10),       color: "#1D4ED8" },
            { href: "/admin/lms",        label: "L&D",         badge: parseInt(s.active_courses,10),   color: "#059669" },
            { href: "/admin/attendance", label: "Attendance",  badge: parseInt(s.clocked_today,10),    color: "#0891B2" },
            { href: "/admin/settings",   label: "Settings",    badge: parseInt(s.total_kgs,10),        color: "#6B7280" },
          ].map(m => (
            <Link key={m.label} href={m.href}
              className="bg-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-center hover:shadow-md transition relative"
              style={{ border: "1px solid #E2E8F0" }}>
              {m.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold px-1"
                  style={{ backgroundColor: m.color, fontSize: "10px" }}>{m.badge}</span>
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "18" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></div>
              </div>
              <span className="text-xs font-semibold leading-tight" style={{ color: "#1E293B" }}>{m.label}</span>
            </Link>
          ))}
        </div>

        {/* Final approval queue */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
            Final Approval Queue
            {pendingLeaves.length > 0 && (
              <span className="ml-2 text-sm px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                {pendingLeaves.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#10B981" }}></span>
            Admin approved · Awaiting your decision
          </div>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center mb-8" style={{ border: "1px solid #E2E8F0" }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#065F46" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>All clear</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>No applications awaiting your approval</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {pendingLeaves.map(leave => {
              const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
              const d = days(leave.start_date, leave.end_date);
              return (
                <div key={leave.id} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #065F46, #047857)" }}>
                          {leave.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{leave.employee_name}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>
                            {leave.employee_code && <span>{leave.employee_code} · </span>}
                            {leave.employee_email}
                            {leave.department && <span> · {leave.department}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>{lm.label} Leave</span>
                        <span className="text-xs font-medium" style={{ color: "#64748B" }}>{fmt(leave.start_date)} — {fmt(leave.end_date)}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{d} day{d !== 1 ? "s" : ""}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>Admin reviewed</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 mb-3">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "#64748B" }}>Reason</p>
                          <p className="text-sm" style={{ color: "#1E293B" }}>{leave.reason}</p>
                        </div>
                        {leave.admin_note && (
                          <div className="p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF" }}>
                            <p className="text-xs font-medium mb-0.5" style={{ color: "#1D4ED8" }}>Admin Note</p>
                            <p className="text-sm" style={{ color: "#1E293B" }}>{leave.admin_note}</p>
                          </div>
                        )}
                      </div>
                      <LeaveActionButtons leaveId={leave.id} role="super_admin" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: "#94A3B8" }}>Applied</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: "#64748B" }}>{fmt(leave.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
