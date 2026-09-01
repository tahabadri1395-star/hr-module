import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import LeaveActionButtons from "@/components/LeaveActionButtons";
import { ARCH_PATTERN, ink, muted, mutedFaint, glassCard } from "@/lib/desktop-theme";

const superPageBg = "radial-gradient(circle at 20% 15%, #064E3B, transparent 55%), radial-gradient(circle at 85% 80%, #065F46, transparent 50%), linear-gradient(160deg, #08130F 0%, #0B1F19 55%, #0A1A15 100%)";

interface LeaveWithEmployee {
  id: number; leave_type: string; start_date: string; end_date: string;
  reason: string; status: string; admin_id: number | null; admin_note: string | null;
  admin_action_at: string | null; created_at: string;
  employee_name: string; employee_email: string; department: string | null; employee_code: string | null;
}

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
  normal:    { label: "Normal",    bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
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
      (SELECT COUNT(*) FROM hr_expenses WHERE status='pending') as pending_expenses,
      (SELECT COUNT(*) FROM hr_murasalat) as total_mura,
      (SELECT COUNT(*) FROM hr_arz WHERE status IN ('open','in_progress')) as open_arz,
      (SELECT COUNT(*) FROM hr_assets) as total_assets,
      (SELECT COUNT(*) FROM hr_documents) as total_docs,
      (SELECT COUNT(*) FROM hr_courses WHERE status='active') as active_courses,
      (SELECT COUNT(DISTINCT employee_id) FROM hr_attendance WHERE date=CURRENT_DATE::text) as clocked_today`),
  ]);

  const pendingLeaves = pendingRes.rows as LeaveWithEmployee[];
  const s = statsRes.rows[0];

  return (
    <div className="min-h-screen relative" style={{ background: superPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />

      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-20 relative"
        style={{ backgroundColor: "rgba(8,19,15,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(52,211,153,0.15)", color: "#6EE7B7" }}>Super Admin</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/admin/leaves"    className="text-xs" style={{ color: mutedFaint }}>Leaves</Link>
          <Link href="/admin/tasks"     className="text-xs" style={{ color: mutedFaint }}>Tasks</Link>
          <Link href="/admin/murasalat" className="text-xs" style={{ color: mutedFaint }}>Murasalat</Link>
          <Link href="/admin/arz"       className="text-xs" style={{ color: mutedFaint }}>Arz</Link>
          <Link href="/admin/assets"    className="text-xs" style={{ color: mutedFaint }}>Assets</Link>
          <Link href="/admin/documents" className="text-xs" style={{ color: mutedFaint }}>Documents</Link>
          <Link href="/admin/lms"        className="text-xs" style={{ color: mutedFaint }}>L&D</Link>
          <Link href="/admin/attendance" className="text-xs" style={{ color: mutedFaint }}>Attendance</Link>
          <Link href="/admin/travel"    className="text-xs" style={{ color: mutedFaint }}>Travel & Expenses</Link>
          <Link href="/admin/settings"  className="text-xs" style={{ color: mutedFaint }}>Settings</Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Sign Out</button>
          </form>
        </div>
      </nav>

      {/* Executive header */}
      <div className="px-6 pb-8 pt-6 max-w-6xl mx-auto relative">
        <p className="text-xs mb-1" style={{ color: mutedFaint }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl font-semibold mb-1" style={{ color: ink }}>Executive Overview</h1>
        <p className="text-sm" style={{ color: muted }}>Final authority — HR Management System</p>

        {/* Wide stat strip */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { label: "Awaiting You",    value: parseInt(s.awaiting, 10),       color: "#6EE7B7", highlight: true },
            { label: "Pending Admin",   value: parseInt(s.pending_admin, 10),  color: "#D9B46C", highlight: false },
            { label: "Fully Approved",  value: parseInt(s.approved, 10),       color: "#6EE7B7", highlight: false },
            { label: "Rejected",        value: parseInt(s.rejected, 10),       color: "#FB7185", highlight: false },
            { label: "Active KGs",      value: parseInt(s.total_kgs, 10),      color: muted, highlight: false },
            { label: "Open Tasks",      value: parseInt(s.open_tasks, 10),     color: muted, highlight: false },
            { label: "Travel & Claims", value: parseInt(s.pending_travel, 10) + parseInt(s.pending_expenses, 10), color: muted, highlight: false },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl px-3 py-3 text-center flex-1 min-w-[110px]"
              style={stat.highlight
                ? { backgroundColor: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.4)" }
                : { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: mutedFaint, fontSize: "10px" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 relative">

        {/* All modules grid */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { href: "/admin/leaves",     label: "Leaves",      badge: parseInt(s.awaiting,10) + parseInt(s.pending_admin,10), color: "#D9B46C" },
            { href: "/admin/tasks",      label: "Tasks",       badge: parseInt(s.open_tasks,10),       color: "#93C5FD" },
            { href: "/admin/travel",     label: "Travel & Expenses", badge: parseInt(s.pending_travel,10) + parseInt(s.pending_expenses,10), color: "#6EE7B7" },
            { href: "/admin/murasalat",  label: "Murasalat",  badge: parseInt(s.total_mura,10),        color: "#C4B5FD" },
            { href: "/admin/arz",        label: "Arz",         badge: parseInt(s.open_arz,10),          color: "#FDBA74" },
            { href: "/admin/assets",     label: "Assets",      badge: parseInt(s.total_assets,10),      color: "#D9B46C" },
            { href: "/admin/documents",  label: "Documents",   badge: parseInt(s.total_docs,10),        color: "#93C5FD" },
            { href: "/admin/lms",        label: "L&D",         badge: parseInt(s.active_courses,10),    color: "#6EE7B7" },
            { href: "/admin/attendance", label: "Attendance",  badge: parseInt(s.clocked_today,10),     color: "#67E8F9" },
            { href: "/admin/settings",   label: "Settings",    badge: parseInt(s.total_kgs,10),         color: "rgba(255,255,255,0.6)" },
          ].map(m => (
            <Link key={m.label} href={m.href}
              className="py-3 px-2 flex flex-col items-center gap-1.5 text-center relative w-[calc(25%-6px)] sm:w-[92px] rounded-xl"
              style={glassCard}>
              {m.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold px-1"
                  style={{ backgroundColor: m.color, color: "#08130F", fontSize: "10px" }}>{m.badge}</span>
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></div>
              </div>
              <span className="text-xs font-semibold leading-tight" style={{ color: ink }}>{m.label}</span>
            </Link>
          ))}
        </div>

        {/* Final approval queue */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: ink }}>
            Final Approval Queue
            {pendingLeaves.length > 0 && (
              <span className="ml-2 text-sm px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "rgba(110,231,183,0.15)", color: "#6EE7B7" }}>
                {pendingLeaves.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(110,231,183,0.15)", color: "#6EE7B7" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#34D399" }}></span>
            Admin approved · Awaiting your decision
          </div>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="rounded-2xl py-16 text-center mb-8" style={glassCard}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(110,231,183,0.15)" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <p className="font-semibold text-sm" style={{ color: ink }}>All clear</p>
            <p className="text-xs mt-1" style={{ color: mutedFaint }}>No applications awaiting your approval</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {pendingLeaves.map(leave => {
              const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
              const d = days(leave.start_date, leave.end_date);
              return (
                <div key={leave.id} className="rounded-2xl p-5" style={glassCard}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #065F46, #047857)" }}>
                          {leave.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: ink }}>{leave.employee_name}</p>
                          <p className="text-xs" style={{ color: mutedFaint }}>
                            {leave.employee_code && <span>{leave.employee_code} · </span>}
                            {leave.employee_email}
                            {leave.department && <span> · {leave.department}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>{lm.label} Leave</span>
                        <span className="text-xs font-medium" style={{ color: muted }}>{fmt(leave.start_date)} — {fmt(leave.end_date)}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: muted }}>{d} day{d !== 1 ? "s" : ""}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(110,231,183,0.15)", color: "#6EE7B7" }}>Admin reviewed</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 mb-3">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: muted }}>Reason</p>
                          <p className="text-sm" style={{ color: ink }}>{leave.reason}</p>
                        </div>
                        {leave.admin_note && (
                          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(96,165,250,0.1)" }}>
                            <p className="text-xs font-medium mb-0.5" style={{ color: "#93C5FD" }}>Admin Note</p>
                            <p className="text-sm" style={{ color: ink }}>{leave.admin_note}</p>
                          </div>
                        )}
                      </div>
                      <LeaveActionButtons leaveId={leave.id} role="super_admin" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: mutedFaint }}>Applied</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: muted }}>{fmt(leave.created_at)}</p>
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
