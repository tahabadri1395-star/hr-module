import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";

interface RecentLeave { id: number; leave_type: string; start_date: string; employee_name: string; created_at: string; }
interface RecentTask  { id: number; title: string; status: string; employee_name: string; due_date: string | null; }

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export default async function AdminDashboardPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin") redirect("/admin/super");

  const [statsRes, recentLeavesRes, recentTasksRes, muraRes] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status='pending') as pending_leaves,
      (SELECT COUNT(*) FROM hr_leave_applications WHERE status='pending' AND leave_type='emergency') as emerg_leaves,
      (SELECT COUNT(*) FROM hr_employees WHERE active=1) as total_kgs,
      (SELECT COUNT(*) FROM hr_tasks WHERE status != 'completed') as open_tasks,
      (SELECT COUNT(*) FROM hr_travel_requests WHERE status='pending') as pending_travel,
      (SELECT COUNT(*) FROM hr_reimbursements WHERE status='pending') as pending_reimb,
      (SELECT COUNT(*) FROM hr_murasalat) as total_mura,
      (SELECT COUNT(*) FROM hr_arz WHERE status IN ('open','in_progress')) as open_arz,
      (SELECT COUNT(*) FROM hr_polls WHERE status='active') as active_polls,
      (SELECT COUNT(*) FROM hr_assets) as total_assets,
      (SELECT COUNT(*) FROM hr_documents) as total_docs,
      (SELECT COUNT(*) FROM hr_courses WHERE status='active') as active_courses`),
    query(`SELECT la.id, la.leave_type, la.start_date, e.name as employee_name, la.created_at FROM hr_leave_applications la JOIN hr_employees e ON e.id=la.employee_id WHERE la.status='pending' ORDER BY la.created_at ASC LIMIT 6`),
    query(`SELECT t.id, t.title, t.status, t.due_date, e.name as employee_name FROM hr_tasks t JOIN hr_employees e ON e.id=t.assigned_to WHERE t.status!='completed' ORDER BY t.created_at DESC LIMIT 4`),
    query(`SELECT id, title, priority, created_at FROM hr_murasalat ORDER BY created_at DESC LIMIT 3`),
  ]);

  const s             = statsRes.rows[0];
  const pendingLeaves = parseInt(s.pending_leaves, 10);
  const emergLeaves   = parseInt(s.emerg_leaves, 10);
  const totalKGs      = parseInt(s.total_kgs, 10);
  const openTasks     = parseInt(s.open_tasks, 10);
  const pendingTravel = parseInt(s.pending_travel, 10);
  const pendingReimb  = parseInt(s.pending_reimb, 10);
  const recentLeaves  = recentLeavesRes.rows as RecentLeave[];
  const recentTasks   = recentTasksRes.rows as RecentTask[];
  const recentMura    = muraRes.rows;

  const openArz = parseInt(s.open_arz, 10);
  const activePolls = parseInt(s.active_polls, 10);
  const totalAssets = parseInt(s.total_assets, 10);
  const totalDocs      = parseInt(s.total_docs, 10);
  const activeCourses  = parseInt(s.active_courses, 10);

  const modules = [
    { href: "/admin/leaves",    label: "Leave Approvals",  badge: pendingLeaves,               color: "#F59E0B", desc: `${emergLeaves} emergency` },
    { href: "/admin/tasks",     label: "Task Management",  badge: openTasks,                   color: "#3B82F6", desc: "assign & track" },
    { href: "/admin/travel",    label: "Travel & Claims",  badge: pendingTravel + pendingReimb, color: "#10B981", desc: `${pendingReimb} claims` },
    { href: "/admin/murasalat", label: "Murasalat",        badge: parseInt(s.total_mura, 10),  color: "#8B5CF6", desc: "circulars" },
    { href: "/admin/arz",       label: "Personal Arz",     badge: openArz,                     color: "#EA580C", desc: "requests & grievances" },
    { href: "/admin/polls",     label: "Polls",            badge: activePolls,                  color: "#06B6D4", desc: "active polls" },
    { href: "/admin/assets",    label: "Asset Tracking",   badge: totalAssets,  color: "#B45309", desc: "equipment & software" },
    { href: "/admin/documents", label: "Document Vault",   badge: totalDocs,      color: "#1D4ED8", desc: "policies & forms" },
    { href: "/admin/lms",       label: "L&D",              badge: activeCourses,  color: "#059669", desc: "courses & training" },
    { href: "/admin/settings",  label: "Settings",         badge: 0,              color: "#6B7280", desc: `${totalKGs} active KGs` },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      {/* Dark top bar */}
      <div style={{ backgroundColor: "#0F172A" }}>
        <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
            </div>
            <span className="font-bold text-sm text-white">HR Module</span>
            <span className="text-xs px-2 py-0.5 rounded text-white/50" style={{ backgroundColor: "#1E293B" }}>Admin</span>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "#475569" }}>Sign Out</button>
          </form>
        </nav>

        {/* Header stats strip */}
        <div className="px-6 pb-8 pt-2 max-w-6xl mx-auto">
          <p className="text-xs mb-2" style={{ color: "#475569" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-bold text-white mb-6">Operations Centre</h1>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {[
              { label: "Pending Leaves",  value: pendingLeaves,  color: "#F59E0B" },
              { label: "Emergency",       value: emergLeaves,    color: "#EF4444" },
              { label: "Open Tasks",      value: openTasks,      color: "#3B82F6" },
              { label: "Travel Pending",  value: pendingTravel,  color: "#10B981" },
              { label: "Claims Pending",  value: pendingReimb,   color: "#8B5CF6" },
              { label: "Active KGs",      value: totalKGs,       color: "#94A3B8" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3" style={{ backgroundColor: "#1E293B" }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-6xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>
        {/* Module Grid */}
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {modules.map(m => (
            <Link key={m.label} href={m.href}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition"
              style={{ border: "1px solid #E2E8F0" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.color + "18" }}>
                {m.badge > 0 && (
                  <span className="text-sm font-bold" style={{ color: m.color }}>{m.badge}</span>
                )}
                {m.badge === 0 && (
                  <span className="text-xs font-bold" style={{ color: m.color }}>—</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1E293B" }}>{m.label}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Pending Leaves */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#F59E0B" }}></div>
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>Pending Leaves</p>
              </div>
              <Link href="/admin/leaves" className="text-xs font-medium" style={{ color: "#F59E0B" }}>Review all →</Link>
            </div>
            {recentLeaves.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>All cleared</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {recentLeaves.map(l => (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{l.employee_name}</p>
                      <p className="text-xs capitalize" style={{ color: "#94A3B8" }}>{l.leave_type} · {fmt(l.start_date)}</p>
                    </div>
                    <Link href="/admin/leaves" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>Review</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>Active Tasks</p>
              </div>
              <Link href="/admin/tasks" className="text-xs font-medium" style={{ color: "#3B82F6" }}>Manage →</Link>
            </div>
            {recentTasks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>No open tasks</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {recentTasks.map(t => (
                  <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "#1E293B" }}>{t.title}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{t.employee_name}{t.due_date ? ` · Due ${fmt(t.due_date)}` : ""}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full ml-3 capitalize font-medium shrink-0"
                      style={{ backgroundColor: t.status === "ongoing" ? "#EFF6FF" : "#FFFBEB", color: t.status === "ongoing" ? "#1D4ED8" : "#B45309" }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Murasalat */}
          {recentMura.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden sm:col-span-2" style={{ border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8B5CF6" }}></div>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>Recent Murasalat</p>
                </div>
                <Link href="/admin/murasalat" className="text-xs font-medium" style={{ color: "#8B5CF6" }}>Manage →</Link>
              </div>
              <div className="grid sm:grid-cols-3 divide-x" style={{ borderColor: "#F1F5F9" }}>
                {recentMura.map((m: { id: number; title: string; priority: string; created_at: string }) => (
                  <div key={m.id} className="px-5 py-4">
                    {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Urgent</span>}
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(m.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
