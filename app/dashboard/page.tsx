import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmployeeFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";
import CancelLeaveButton from "@/components/CancelLeaveButton";
import TaskStatusButton from "@/components/TaskStatusButton";

interface Task { id: number; title: string; description: string | null; priority: "low"|"medium"|"high"; status: "pending"|"ongoing"|"completed"; due_date: string | null; }
interface LeaveApp { id: number; leave_type: string; start_date: string; end_date: string; is_half_day: boolean; half_day_period: string | null; reason: string; status: string; admin_note: string | null; super_admin_note: string | null; created_at: string; }
interface Murasalat { id: number; title: string; body: string; priority: string; created_at: string; is_read: boolean; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:              { label: "Pending",        color: "#B45309" },
  admin_approved:       { label: "Admin Approved", color: "#1D4ED8" },
  approved:             { label: "Approved",       color: "#15803D" },
  admin_rejected:       { label: "Rejected",       color: "#DC2626" },
  super_admin_rejected: { label: "Rejected",       color: "#DC2626" },
};

const P_COLOR = { high: "#E11D48", medium: "#B45309", low: "#15803D" };
const P_BG    = { high: "#FFF1F2", medium: "#FFFBEB", low: "#F0FDF4" };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function DashboardPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/login");

  const yr = new Date().getFullYear();
  const empRes = await query(`SELECT department FROM hr_employees WHERE id=$1`, [employee.id]);
  const dept: string | null = empRes.rows[0]?.department ?? null;

  const [leavesRes, tasksRes, emergRes, muraRes, arzRes, pollsRes, assetsRes] = await Promise.all([
    query(`SELECT * FROM hr_leave_applications WHERE employee_id=$1 ORDER BY created_at DESC`, [employee.id]),
    query(`SELECT * FROM hr_tasks WHERE assigned_to=$1 ORDER BY CASE status WHEN 'ongoing' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END, created_at DESC`, [employee.id]),
    query(`SELECT COUNT(*) as used FROM hr_leave_applications WHERE employee_id=$1 AND leave_type='emergency' AND status NOT IN ('admin_rejected','super_admin_rejected') AND start_date BETWEEN $2 AND $3`, [employee.id, `${yr}-01-01`, `${yr}-12-31`]),
    query(`SELECT m.*, CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read FROM hr_murasalat m LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id=m.id AND mr.employee_id=$1 WHERE m.department IS NULL OR m.department=$2 ORDER BY m.created_at DESC LIMIT 5`, [employee.id, dept ?? ""]),
    query(`SELECT COUNT(*) as open FROM hr_arz WHERE employee_id=$1 AND status IN ('open','in_progress')`, [employee.id]),
    query(`SELECT COUNT(*) as pending FROM hr_polls p WHERE p.status='active' AND NOT EXISTS (SELECT 1 FROM hr_poll_votes WHERE poll_id=p.id AND employee_id=$1)`, [employee.id]),
    query(`SELECT COUNT(*) as count FROM hr_asset_assignments WHERE employee_id=$1 AND status='active'`, [employee.id]),
  ]);

  const leaves = leavesRes.rows as LeaveApp[];
  const tasks  = tasksRes.rows as Task[];
  const emergLeft  = Math.max(0, 7 - parseInt(emergRes.rows[0].used, 10));
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const pendingLeaves = leaves.filter(l => l.status === "pending" || l.status === "admin_approved");
  const murasalat  = muraRes.rows as Murasalat[];
  const unreadMura = murasalat.filter(m => !m.is_read).length;
  const openArz = parseInt(arzRes.rows[0].open, 10);
  const pendingPolls = parseInt(pollsRes.rows[0].pending, 10);
  const myAssets = parseInt(assetsRes.rows[0].count, 10);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      {/* Nav */}
      <nav className="px-6 h-14 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90">Khidmat Guzar</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80 hidden sm:block">{employee.name}</span>
          <Link href="/profile" className="text-xs text-white/70 hover:text-white">Profile</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs text-white/50 hover:text-white/80">Sign Out</button>
          </form>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-6 py-8 text-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
          {employee.name.charAt(0)}
        </div>
        <h1 className="text-xl font-bold text-white">Welcome, {employee.name.split(" ")[0]}</h1>
        {dept && <p className="text-sm mt-0.5 text-white/60">{dept}</p>}
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/15 text-white">{emergLeft} emergency {emergLeft === 1 ? "leave" : "leaves"} left</span>
          {pendingLeaves.length > 0 && <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-400/30 text-yellow-100">{pendingLeaves.length} leave in progress</span>}
          {activeTasks.length > 0 && <span className="text-xs px-3 py-1.5 rounded-full bg-cyan-400/20 text-cyan-100">{activeTasks.length} active {activeTasks.length === 1 ? "task" : "tasks"}</span>}
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {[
            { href: "/apply",      label: "Apply Leave",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#4F46E5", badge: null },
            { href: "#tasks",      label: "My Tasks",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "#0891B2", badge: activeTasks.length || null },
            { href: "/murasalat",  label: "Murasalat",     icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "#7C3AED", badge: unreadMura || null },
            { href: "/arz",        label: "Personal Arz",  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "#EA580C", badge: openArz || null },
            { href: "/polls",      label: "Polls",         icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "#0891B2", badge: pendingPolls || null },
            { href: "/assets",     label: "My Assets",     icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#B45309", badge: myAssets || null },
            { href: "/travel",     label: "Travel",        icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", color: "#059669", badge: null },
            { href: "/profile",    label: "My Profile",    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#DC2626", badge: null },
          ].map(m => (
            <Link key={m.label} href={m.href} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md transition relative">
              {m.badge && <span className="absolute top-2 right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: m.color }}>{m.badge}</span>}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "18" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d={m.icon} stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>{m.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Tasks",  value: activeTasks.length,                              color: "#0891B2" },
            { label: "Emerg. Left",   value: emergLeft,                                        color: "#E11D48" },
            { label: "Approved",      value: leaves.filter(l => l.status === "approved").length, color: "#15803D" },
            { label: "Unread",        value: unreadMura,                                       color: "#7C3AED" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl px-4 py-3 text-center shadow-sm">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Murasalat unread */}
        {murasalat.filter(m => !m.is_read).length > 0 && (
          <div className="mb-5 rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #E9D5FF", backgroundColor: "#FAF5FF" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E9D5FF" }}>
              <p className="text-sm font-semibold" style={{ color: "#7C3AED" }}>Unread Murasalat</p>
              <Link href="/murasalat" className="text-xs font-medium" style={{ color: "#7C3AED" }}>View all →</Link>
            </div>
            {murasalat.filter(m => !m.is_read).map(m => (
              <div key={m.id} className="px-5 py-3 border-b last:border-b-0" style={{ borderColor: "#E9D5FF" }}>
                <div className="flex items-center gap-2">
                  {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Urgent</span>}
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
                </div>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#64748B" }}>{m.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div id="tasks" className="bg-white rounded-2xl overflow-hidden shadow-sm mb-5" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>Active Tasks</p>
              <span className="text-xs" style={{ color: "#94A3B8" }}>{tasks.filter(t => t.status === "ongoing").length} ongoing · {tasks.filter(t => t.status === "pending").length} pending</span>
            </div>
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {activeTasks.map(task => {
                const overdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: P_BG[task.priority], color: P_COLOR[task.priority] }}>{task.priority}</span>
                      {overdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Overdue</span>}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{task.title}</p>
                    {task.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{task.description}</p>}
                    {task.due_date && <p className="text-xs mt-1" style={{ color: overdue ? "#DC2626" : "#94A3B8" }}>Due {fmt(task.due_date)}</p>}
                    <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                  </div>
                );
              })}
              {tasks.filter(t => t.status === "completed").length > 0 && (
                <div className="px-5 py-3 flex gap-3 flex-wrap">
                  {tasks.filter(t => t.status === "completed").map(t => (
                    <span key={t.id} className="text-xs" style={{ color: "#CBD5E1", textDecoration: "line-through" }}>{t.title}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaves */}
        <div id="leaves" className="bg-white rounded-2xl overflow-hidden shadow-sm mb-8" style={{ border: "1px solid #E2E8F0" }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>Leave Applications</p>
            <Link href="/apply" className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>+ Apply</Link>
          </div>
          {leaves.length === 0 ? (
            <div className="py-12 text-center"><p className="text-sm" style={{ color: "#94A3B8" }}>No applications yet</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {leaves.map(leave => {
                const sl = STATUS_LABEL[leave.status] ?? STATUS_LABEL.pending;
                const isRej = leave.status.includes("rejected");
                const days = leave.is_half_day ? "Half Day" : (Math.floor((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / 86400000) + 1) + "d";
                return (
                  <div key={leave.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold capitalize" style={{ color: leave.leave_type === "emergency" ? "#E11D48" : "#4338CA" }}>{leave.leave_type}</span>
                        <span className="text-xs" style={{ color: "#CBD5E1" }}>·</span>
                        <span className="text-xs font-semibold" style={{ color: sl.color }}>{sl.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{days}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>
                        {fmt(leave.start_date)}{!leave.is_half_day && leave.end_date !== leave.start_date ? ` — ${fmt(leave.end_date)}` : ""}
                      </p>
                      {isRej && (leave.admin_note || leave.super_admin_note) && (
                        <div className="mt-1.5 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "#FEF2F2", color: "#7F1D1D" }}>
                          {leave.status === "admin_rejected" ? leave.admin_note : leave.super_admin_note}
                        </div>
                      )}
                      {leave.status === "approved" && <Link href={`/leave/${leave.id}`} className="text-xs font-medium mt-1 inline-block" style={{ color: "#4F46E5" }}>View Slip →</Link>}
                      {leave.status === "pending" && <CancelLeaveButton leaveId={leave.id} />}
                    </div>
                    <p className="text-xs shrink-0" style={{ color: "#94A3B8" }}>{fmt(leave.created_at)}</p>
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
