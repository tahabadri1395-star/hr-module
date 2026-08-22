import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmployeeFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";
import { getISTDateTime } from "@/lib/time";
import CancelLeaveButton from "@/components/CancelLeaveButton";
import TaskStatusButton from "@/components/TaskStatusButton";
import AvatarUpload from "@/components/AvatarUpload";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Task { id: number; title: string; description: string | null; priority: "low"|"medium"|"high"; status: "pending"|"ongoing"|"completed"; due_date: string | null; }
interface LeaveApp { id: number; leave_type: string; start_date: string; end_date: string; is_half_day: boolean; half_day_period: string | null; reason: string; status: string; admin_note: string | null; super_admin_note: string | null; created_at: string; }
interface Murasalat { id: number; title: string; body: string; priority: string; created_at: string; is_read: boolean; }

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:              { label: "Pending",        color: "#FBBF24", bg: "rgba(251,191,36,0.15)" },
  admin_approved:       { label: "Admin Approved", color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
  approved:             { label: "Approved",       color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  admin_rejected:       { label: "Rejected",       color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  super_admin_rejected: { label: "Rejected",       color: "#F87171", bg: "rgba(248,113,113,0.15)" },
};

const P_COLOR = { high: "#FB7185", medium: "#FBBF24", low: "#4ADE80" };
const P_BG    = { high: "rgba(251,113,133,0.15)", medium: "rgba(251,191,36,0.15)", low: "rgba(74,222,128,0.15)" };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function EmergencyRing({ remaining, total }: { remaining: number; total: number }) {
  const size = 40, stroke = 5, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const frac = total > 0 ? remaining / total : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={gold} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: ink }}>{remaining}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/login");

  const yr = new Date().getFullYear();
  const empRes = await query(
    `SELECT e.department, p.profile_picture_url FROM hr_employees e LEFT JOIN hr_employee_profiles p ON p.employee_id = e.id WHERE e.id=$1`,
    [employee.id]
  );
  const dept: string | null = empRes.rows[0]?.department ?? null;
  const pictureUrl: string | null = empRes.rows[0]?.profile_picture_url ?? null;

  const todayStr = getISTDateTime().date;
  const [leavesRes, tasksRes, emergRes, muraRes, arzRes, assetsRes, docsRes, lmsRes, attendRes, expensesRes, travelRes] = await Promise.all([
    query(`SELECT * FROM hr_leave_applications WHERE employee_id=$1 ORDER BY created_at DESC`, [employee.id]),
    query(`SELECT * FROM hr_tasks WHERE assigned_to=$1 ORDER BY CASE status WHEN 'ongoing' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END, created_at DESC`, [employee.id]),
    query(`SELECT COUNT(*) as used FROM hr_leave_applications WHERE employee_id=$1 AND leave_type='emergency' AND status NOT IN ('admin_rejected','super_admin_rejected') AND start_date BETWEEN $2 AND $3`, [employee.id, `${yr}-01-01`, `${yr}-12-31`]),
    query(`SELECT m.*, CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read FROM hr_murasalat m LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id=m.id AND mr.employee_id=$1 WHERE m.department IS NULL OR m.department=$2 ORDER BY m.created_at DESC LIMIT 5`, [employee.id, dept ?? ""]),
    query(`SELECT COUNT(*) as open FROM hr_arz WHERE employee_id=$1 AND status IN ('open','in_progress')`, [employee.id]),
    query(`SELECT COUNT(*) as count FROM hr_asset_assignments WHERE employee_id=$1 AND status='active'`, [employee.id]),
    query(`SELECT COUNT(*) as count FROM hr_documents WHERE department IS NULL OR department=(SELECT department FROM hr_employees WHERE id=$1)`, [employee.id]),
    query(`SELECT COUNT(*) as count FROM hr_courses c WHERE c.status='active' AND (c.department IS NULL OR c.department=(SELECT department FROM hr_employees WHERE id=$1)) AND NOT EXISTS (SELECT 1 FROM hr_course_progress WHERE course_id=c.id AND employee_id=$1 AND status='completed')`, [employee.id]),
    query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date=$2`, [employee.id, todayStr]),
    query(`SELECT COUNT(*) as count FROM hr_expenses WHERE employee_id=$1 AND status='pending'`, [employee.id]),
    query(`SELECT COUNT(*) as count FROM hr_travel_requests WHERE employee_id=$1 AND status='pending'`, [employee.id]),
  ]);

  const leaves = leavesRes.rows as LeaveApp[];
  const tasks  = tasksRes.rows as Task[];
  const emergLeft  = Math.max(0, 7 - parseInt(emergRes.rows[0].used, 10));
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const pendingLeaves = leaves.filter(l => l.status === "pending" || l.status === "admin_approved");
  const murasalat  = muraRes.rows as Murasalat[];
  const unreadMura = murasalat.filter(m => !m.is_read).length;
  const openArz = parseInt(arzRes.rows[0].open, 10);
  const myAssets = parseInt(assetsRes.rows[0].count, 10);
  const docCount     = parseInt(docsRes.rows[0].count, 10);
  const pendingLMS    = parseInt(lmsRes.rows[0].count, 10);
  const todayAttend     = attendRes.rows[0] ?? null;
  const clockedIn       = !!todayAttend;
  const clockedOut      = !!todayAttend?.clock_out;
  const pendingExpenses = parseInt(expensesRes.rows[0].count, 10);
  const pendingTravel   = parseInt(travelRes.rows[0].count, 10);

  return (
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />

      {/* Nav */}
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-20 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ ...glassPill, color: muted }}>Khidmat Guzar</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block" style={{ color: muted }}>{employee.name}</span>
          <Link href="/profile" className="text-xs transition-colors" style={{ color: muted }}>Profile</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs transition-colors" style={{ color: mutedFaint }}>Sign Out</button>
          </form>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-6 py-9 text-center relative overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ top: "-80px", right: "10%", width: "280px", height: "280px", borderRadius: "9999px", background: "radial-gradient(circle, rgba(217,180,108,0.12), transparent 70%)" }} />
        <div className="relative animate-in">
          <AvatarUpload name={employee.name} initialUrl={pictureUrl} />
          <h1 className="text-xl font-bold tracking-tight" style={{ color: ink }}>Welcome, {employee.name.split(" ")[0]}</h1>
          {dept && <p className="text-sm mt-0.5" style={{ color: muted }}>{dept}</p>}
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded-full" style={{ ...glassPill, color: ink }}>{emergLeft} emergency {emergLeft === 1 ? "leave" : "leaves"} left</span>
            {pendingLeaves.length > 0 && <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}>{pendingLeaves.length} leave in progress</span>}
            {activeTasks.length > 0 && <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(96,165,250,0.15)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.25)" }}>{activeTasks.length} active {activeTasks.length === 1 ? "task" : "tasks"}</span>}
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="flex flex-wrap justify-center gap-2 mb-6 animate-in animate-in-delay-1">
          {[
            { href: "/apply",      label: "Apply Leave",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#818CF8", badge: null },
            { href: "#tasks",      label: "My Tasks",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "#38BDF8", badge: activeTasks.length || null },
            { href: "/murasalat",  label: "Murasalat",     icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "#A78BFA", badge: unreadMura || null },
            { href: "/arz",        label: "Personal Arz",  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "#FB923C", badge: openArz || null },
            { href: "/assets",     label: "My Assets",     icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: gold, badge: myAssets || null },
            { href: "/documents",  label: "Documents",     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "#60A5FA", badge: docCount || null },
            { href: "/lms",        label: "Training",      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "#34D399", badge: pendingLMS || null },
            { href: "/attendance", label: "Attendance",    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: clockedOut ? "#34D399" : clockedIn ? "#60A5FA" : "rgba(255,255,255,0.4)", badge: null },
            { href: "/travel",     label: "Travel & Expenses", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", color: "#34D399", badge: (pendingExpenses + pendingTravel) || null },
            { href: "/profile",    label: "My Profile",    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#F87171", badge: null },
          ].map(m => (
            <Link key={m.label} href={m.href} className="card-hover p-3 flex flex-col items-center gap-1.5 text-center relative w-[calc(25%-6px)] sm:w-[76px]"
              style={{ ...glassCard, borderRadius: "18px" }}>
              {m.badge && <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: m.color, fontSize: "10px" }}>{m.badge}</span>}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "22" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d={m.icon} stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs font-semibold leading-tight" style={{ color: ink }}>{m.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6 animate-in animate-in-delay-2">
          <div className="px-3 py-3 text-center flex flex-col items-center justify-center gap-1" style={{ ...glassCard, borderRadius: "18px" }}>
            <EmergencyRing remaining={emergLeft} total={7} />
            <p className="text-xs mt-0.5" style={{ color: muted }}>Emerg. Left</p>
          </div>
          {[
            { label: "Active Tasks", value: activeTasks.length, color: "#38BDF8", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
            { label: "Approved",     value: leaves.filter(l => l.status === "approved").length, color: "#4ADE80", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { label: "Unread",       value: unreadMura, color: "#A78BFA", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          ].map(s => (
            <div key={s.label} className="px-3 py-3 text-center flex flex-col items-center justify-center gap-1" style={{ ...glassCard, borderRadius: "18px" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "22" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d={s.icon} stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-lg font-bold leading-none mt-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Murasalat unread */}
        {murasalat.filter(m => !m.is_read).length > 0 && (
          <div className="mb-5 overflow-hidden animate-in animate-in-delay-3" style={{ ...glassCard, backgroundColor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: "#A78BFA" }}>Unread Murasalat</p>
              <Link href="/murasalat" className="text-xs font-medium" style={{ color: "#A78BFA" }}>View all →</Link>
            </div>
            {murasalat.filter(m => !m.is_read).map(m => (
              <div key={m.id} className="px-5 py-3 border-b last:border-b-0" style={{ borderColor: "rgba(167,139,250,0.15)" }}>
                <div className="flex items-center gap-2">
                  {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Urgent</span>}
                  <p className="text-sm font-semibold" style={{ color: ink }}>{m.title}</p>
                </div>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: muted }}>{m.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div id="tasks" className="overflow-hidden mb-5" style={glassCard}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-semibold" style={{ color: ink }}>Active Tasks</p>
              <span className="text-xs" style={{ color: muted }}>{tasks.filter(t => t.status === "ongoing").length} ongoing · {tasks.filter(t => t.status === "pending").length} pending</span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {activeTasks.map(task => {
                const overdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: P_BG[task.priority], color: P_COLOR[task.priority] }}>{task.priority}</span>
                      {overdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Overdue</span>}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: ink }}>{task.title}</p>
                    {task.description && <p className="text-xs mt-0.5" style={{ color: muted }}>{task.description}</p>}
                    {task.due_date && <p className="text-xs mt-1" style={{ color: overdue ? "#F87171" : mutedFaint }}>Due {fmt(task.due_date)}</p>}
                    <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                  </div>
                );
              })}
              {tasks.filter(t => t.status === "completed").length > 0 && (
                <div className="px-5 py-3 flex gap-3 flex-wrap">
                  {tasks.filter(t => t.status === "completed").map(t => (
                    <span key={t.id} className="text-xs" style={{ color: mutedFaint, textDecoration: "line-through" }}>{t.title}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaves */}
        <div id="leaves" className="overflow-hidden mb-8" style={glassCard}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold" style={{ color: ink }}>Leave Applications</p>
            <Link href="/apply" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: gold, color: "#1B1630" }}>+ Apply</Link>
          </div>
          {leaves.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(129,140,248,0.15)" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: ink }}>No applications yet</p>
              <p className="text-xs mt-1" style={{ color: muted }}>Apply for leave whenever you need to</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {leaves.map(leave => {
                const sl = STATUS_LABEL[leave.status] ?? STATUS_LABEL.pending;
                const isRej = leave.status.includes("rejected");
                const days = leave.is_half_day ? "Half Day" : (Math.floor((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / 86400000) + 1) + "d";
                return (
                  <div key={leave.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold capitalize" style={{ color: leave.leave_type === "emergency" ? "#FB7185" : "#A78BFA" }}>{leave.leave_type}</span>
                        <span className="text-xs" style={{ color: mutedFaint }}>·</span>
                        <span className="text-xs font-semibold" style={{ color: sl.color }}>{sl.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ ...glassPill, color: muted }}>{days}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: ink }}>
                        {fmt(leave.start_date)}{!leave.is_half_day && leave.end_date !== leave.start_date ? ` — ${fmt(leave.end_date)}` : ""}
                      </p>
                      {isRej && (leave.admin_note || leave.super_admin_note) && (
                        <div className="mt-1.5 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "rgba(248,113,113,0.12)", color: "#FCA5A5" }}>
                          {leave.status === "admin_rejected" ? leave.admin_note : leave.super_admin_note}
                        </div>
                      )}
                      {leave.status === "approved" && <Link href={`/leave/${leave.id}`} className="text-xs font-medium mt-1 inline-block" style={{ color: gold }}>View Slip →</Link>}
                      {leave.status === "pending" && <CancelLeaveButton leaveId={leave.id} />}
                    </div>
                    <p className="text-xs shrink-0" style={{ color: mutedFaint }}>{fmt(leave.created_at)}</p>
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
