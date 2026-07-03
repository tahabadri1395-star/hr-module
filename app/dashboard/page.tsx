import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmployeeFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";
import CancelLeaveButton from "@/components/CancelLeaveButton";
import TaskStatusButton from "@/components/TaskStatusButton";

interface Task {
  id: number; title: string; description: string | null;
  priority: "low" | "medium" | "high"; status: "pending" | "ongoing" | "completed";
  due_date: string | null;
}

interface LeaveApp {
  id: number; leave_type: string; start_date: string; end_date: string;
  is_half_day: boolean; half_day_period: string | null; reason: string; status: string;
  admin_note: string | null; super_admin_note: string | null; created_at: string;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "Pending",           bg: "#FFFBEB", color: "#B45309" },
  admin_approved:       { label: "Admin Approved",    bg: "#EFF6FF", color: "#1D4ED8" },
  approved:             { label: "Approved",          bg: "#F0FDF4", color: "#15803D" },
  admin_rejected:       { label: "Rejected",          bg: "#FEF2F2", color: "#DC2626" },
  super_admin_rejected: { label: "Rejected",          bg: "#FEF2F2", color: "#DC2626" },
};

const PRIORITY_META = {
  high:   { label: "High",   bg: "#FFF1F2", color: "#E11D48" },
  medium: { label: "Medium", bg: "#FFFBEB", color: "#B45309" },
  low:    { label: "Low",    bg: "#F0FDF4", color: "#15803D" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/login");

  const currentYear = new Date().getFullYear();
  const [leavesRes, tasksRes, emergencyRes] = await Promise.all([
    query(`SELECT * FROM hr_leave_applications WHERE employee_id=$1 ORDER BY created_at DESC`, [employee.id]),
    query(`SELECT * FROM hr_tasks WHERE assigned_to=$1 ORDER BY CASE status WHEN 'ongoing' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END, created_at DESC`, [employee.id]),
    query(`SELECT COUNT(*) as used FROM hr_leave_applications WHERE employee_id=$1 AND leave_type='emergency' AND status NOT IN ('admin_rejected','super_admin_rejected') AND start_date BETWEEN $2 AND $3`,
      [employee.id, `${currentYear}-01-01`, `${currentYear}-12-31`]),
  ]);

  const leaves      = leavesRes.rows as LeaveApp[];
  const tasks       = tasksRes.rows as Task[];
  const emergUsed   = parseInt(emergencyRes.rows[0].used, 10);
  const emergLeft   = Math.max(0, 7 - emergUsed);
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const pendingLeaves = leaves.filter(l => l.status === "pending" || l.status === "admin_approved");

  const modules = [
    { href: "/apply",   label: "Apply Leave",   desc: "Submit a leave request",      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", accent: "#4F46E5", bg: "#EEF2FF" },
    { href: "#tasks",   label: "My Tasks",      desc: `${activeTasks.length} active`, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", accent: "#0891B2", bg: "#ECFEFF" },
    { href: "/profile", label: "My Profile",    desc: "Personal information",         icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", accent: "#7C3AED", bg: "#F5F3FF" },
    { href: "#leaves",  label: "Leave History", desc: `${leaves.length} applications`, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", accent: "#059669", bg: "#ECFDF5" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Nav */}
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm hidden sm:block" style={{ color: "#64748B" }}>{employee.name}</span>
          <Link href="/profile" className="text-xs" style={{ color: "#64748B" }}>Profile</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "#94A3B8" }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="rounded-2xl p-6 mb-8 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)" }}>
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl font-bold text-white">Welcome, {employee.name.split(" ")[0]}</h1>
            {employee.department && <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>{employee.department}</p>}
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            {emergLeft === 0 ? (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                Emergency leave exhausted
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#E2E8F0" }}>
                {emergLeft} emergency {emergLeft === 1 ? "leave" : "leaves"} remaining
              </span>
            )}
            {pendingLeaves.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>
                {pendingLeaves.length} leave{pendingLeaves.length > 1 ? "s" : ""} in progress
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Tasks",  value: activeTasks.length,  color: "#0891B2", bg: "#ECFEFF" },
            { label: "Leave Pending", value: pendingLeaves.length, color: "#B45309", bg: "#FFFBEB" },
            { label: "Approved",      value: leaves.filter(l => l.status === "approved").length, color: "#15803D", bg: "#F0FDF4" },
            { label: "Emerg. Left",   value: emergLeft,            color: "#E11D48", bg: "#FFF1F2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {modules.map(m => (
            <Link key={m.label} href={m.href}
              className="bg-white rounded-xl border p-4 flex flex-col gap-3 transition hover:shadow-sm"
              style={{ borderColor: "#E2E8F0" }}>
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

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div id="tasks" className="bg-white rounded-xl border overflow-hidden mb-6" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="font-semibold text-sm" style={{ color: "#1E293B" }}>Active Tasks</h2>
              <span className="text-xs" style={{ color: "#94A3B8" }}>
                {tasks.filter(t => t.status === "ongoing").length} ongoing · {tasks.filter(t => t.status === "pending").length} pending
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {activeTasks.map(task => {
                const pm = PRIORITY_META[task.priority];
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="px-6 py-4">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: pm.bg, color: pm.color }}>{pm.label}</span>
                      {isOverdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Overdue</span>}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{task.title}</p>
                    {task.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{task.description}</p>}
                    {task.due_date && (
                      <p className="text-xs mt-1" style={{ color: isOverdue ? "#DC2626" : "#94A3B8" }}>
                        Due {fmt(task.due_date)}
                      </p>
                    )}
                    <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                  </div>
                );
              })}
              {tasks.filter(t => t.status === "completed").length > 0 && (
                <div className="px-6 py-3 flex gap-3 flex-wrap">
                  {tasks.filter(t => t.status === "completed").map(task => (
                    <span key={task.id} className="text-xs" style={{ color: "#CBD5E1", textDecoration: "line-through" }}>{task.title}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave Applications */}
        <div id="leaves" className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
            <h2 className="font-semibold text-sm" style={{ color: "#1E293B" }}>Leave Applications</h2>
            <Link href="/apply"
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              + Apply
            </Link>
          </div>
          {leaves.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>No applications yet</p>
              <p className="text-xs mb-4" style={{ color: "#94A3B8" }}>Submit your first leave request</p>
              <Link href="/apply" className="inline-block text-xs font-medium px-5 py-2.5 rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>Apply Now</Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
              {leaves.map(leave => {
                const sm = STATUS_META[leave.status] ?? STATUS_META.pending;
                const isRejected = leave.status === "admin_rejected" || leave.status === "super_admin_rejected";
                const days = leave.is_half_day ? "Half Day" :
                  (Math.floor((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / 86400000) + 1) + " days";
                return (
                  <div key={leave.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: leave.leave_type === "emergency" ? "#FFF1F2" : "#EEF2FF",
                            color: leave.leave_type === "emergency" ? "#E11D48" : "#4338CA" }}>
                          {leave.leave_type}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{days}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>
                        {fmt(leave.start_date)}{!leave.is_half_day && leave.end_date !== leave.start_date ? ` — ${fmt(leave.end_date)}` : ""}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>{leave.reason}</p>
                      {isRejected && (leave.admin_note || leave.super_admin_note) && (
                        <div className="mt-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECDD3" }}>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: "#DC2626" }}>Rejection Reason</p>
                          <p className="text-xs" style={{ color: "#7F1D1D" }}>
                            {leave.status === "admin_rejected" ? leave.admin_note : leave.super_admin_note}
                          </p>
                        </div>
                      )}
                      {leave.status === "approved" && (
                        <Link href={`/leave/${leave.id}`} className="inline-block mt-1.5 text-xs font-medium" style={{ color: "#4F46E5" }}>View Slip →</Link>
                      )}
                      {leave.status === "pending" && <CancelLeaveButton leaveId={leave.id} />}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{fmt(leave.created_at)}</p>
                      {leave.status === "admin_approved" && <p className="text-xs mt-1" style={{ color: "#1D4ED8" }}>Awaiting HR</p>}
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
