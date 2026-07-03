import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";

interface RecentLeave {
  id: number; leave_type: string; start_date: string; employee_name: string; created_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminDashboardPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin") redirect("/admin/super");

  const [leavesRes, kgRes, tasksRes, recentRes] = await Promise.all([
    query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE leave_type='emergency') as emergency FROM hr_leave_applications WHERE status='pending'`),
    query(`SELECT COUNT(*) as total FROM hr_employees WHERE active=1`),
    query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='ongoing') as ongoing FROM hr_tasks WHERE status != 'completed'`),
    query(`SELECT la.id, la.leave_type, la.start_date, e.name as employee_name, la.created_at FROM hr_leave_applications la JOIN hr_employees e ON e.id=la.employee_id WHERE la.status='pending' ORDER BY la.created_at ASC LIMIT 5`),
  ]);

  const pendingLeaves  = parseInt(leavesRes.rows[0].total, 10);
  const emergencyLeaves = parseInt(leavesRes.rows[0].emergency, 10);
  const totalKGs       = parseInt(kgRes.rows[0].total, 10);
  const openTasks      = parseInt(tasksRes.rows[0].total, 10);
  const ongoingTasks   = parseInt(tasksRes.rows[0].ongoing, 10);
  const recent         = recentRes.rows as RecentLeave[];

  const modules = [
    {
      href: "/admin/leaves", label: "Leave Approvals", desc: "Review and approve requests",
      badge: pendingLeaves > 0 ? pendingLeaves : null, badgeColor: "#B45309", badgeBg: "#FFFBEB",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      accent: "#4F46E5", bg: "#EEF2FF",
    },
    {
      href: "/admin/tasks", label: "Task Management", desc: "Assign and track tasks",
      badge: openTasks > 0 ? openTasks : null, badgeColor: "#0891B2", badgeBg: "#ECFEFF",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      accent: "#0891B2", bg: "#ECFEFF",
    },
    {
      href: "/admin/settings?tab=khidmat-guzars", label: "Khidmat Guzars", desc: `${totalKGs} active members`,
      badge: null, badgeColor: "", badgeBg: "",
      icon: "M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2zM9 3v4a1 1 0 001 1h4",
      accent: "#7C3AED", bg: "#F5F3FF",
    },
    {
      href: "/admin/calendar", label: "Calendar", desc: "Team leave overview",
      badge: null, badgeColor: "", badgeBg: "",
      icon: "M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      accent: "#059669", bg: "#ECFDF5",
    },
    {
      href: "/admin/settings", label: "Settings", desc: "Manage holidays & accounts",
      badge: null, badgeColor: "", badgeBg: "",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      accent: "#475569", bg: "#F1F5F9",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>Admin</span>
        </div>
        <div className="flex items-center gap-5">
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "#94A3B8" }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>HR Management System</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Approvals", value: pendingLeaves,  color: "#B45309", bg: "#FFFBEB", sub: `${emergencyLeaves} emergency` },
            { label: "Active KGs",        value: totalKGs,        color: "#4F46E5", bg: "#EEF2FF", sub: "members" },
            { label: "Open Tasks",        value: openTasks,       color: "#0891B2", bg: "#ECFEFF", sub: `${ongoingTasks} ongoing` },
            { label: "Modules",           value: 3,               color: "#7C3AED", bg: "#F5F3FF", sub: "active" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#64748B" }}>{s.label}</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Module Grid */}
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {modules.map(m => (
            <Link key={m.label} href={m.href}
              className="bg-white rounded-xl border p-5 flex flex-col gap-3 transition hover:shadow-sm relative"
              style={{ borderColor: "#E2E8F0" }}>
              {m.badge !== null && (
                <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: m.badgeBg, color: m.badgeColor }}>
                  {m.badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d={m.icon} stroke={m.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Pending Leaves */}
        {recent.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Awaiting Your Review</h2>
              <Link href="/admin/leaves" className="text-xs font-medium" style={{ color: "#4F46E5" }}>Review all →</Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {recent.map(l => (
                <div key={l.id} className="px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                      {l.employee_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{l.employee_name}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>
                        <span className="capitalize">{l.leave_type}</span> · {fmt(l.start_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Applied {fmt(l.created_at)}</span>
                    <Link href="/admin/leaves" className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: "#E2E8F0", color: "#4F46E5" }}>Review</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recent.length === 0 && (
          <div className="bg-white rounded-xl border px-6 py-8 text-center" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>All caught up</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>No pending leave applications</p>
          </div>
        )}
      </div>
    </div>
  );
}
