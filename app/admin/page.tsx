import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

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
      (SELECT COUNT(*) FROM hr_murasalat) as total_mura,
      (SELECT COUNT(*) FROM hr_arz WHERE status IN ('open','in_progress')) as open_arz,
      (SELECT COUNT(*) FROM hr_assets) as total_assets,
      (SELECT COUNT(*) FROM hr_documents) as total_docs,
      (SELECT COUNT(*) FROM hr_courses WHERE status='active') as active_courses,
      (SELECT COUNT(DISTINCT employee_id) FROM hr_attendance WHERE date=CURRENT_DATE::text) as clocked_today,
      (SELECT COUNT(*) FROM hr_expenses WHERE status='pending') as pending_expenses`),
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
  const recentLeaves  = recentLeavesRes.rows as RecentLeave[];
  const recentTasks   = recentTasksRes.rows as RecentTask[];
  const recentMura    = muraRes.rows;

  const openArz = parseInt(s.open_arz, 10);
  const totalAssets = parseInt(s.total_assets, 10);
  const totalDocs      = parseInt(s.total_docs, 10);
  const activeCourses  = parseInt(s.active_courses, 10);
  const clockedToday    = parseInt(s.clocked_today, 10);
  const pendingExpenses = parseInt(s.pending_expenses, 10);

  const modules = [
    { href: "/admin/leaves",    label: "Leave Approvals",  badge: pendingLeaves,               color: gold, desc: `${emergLeaves} emergency` },
    { href: "/admin/tasks",     label: "Task Management",  badge: openTasks,                   color: "#60A5FA", desc: "assign & track" },
    { href: "/admin/travel",    label: "Travel & Expenses", badge: pendingTravel + pendingExpenses, color: "#34D399", desc: `${pendingExpenses} claims` },
    { href: "/admin/murasalat", label: "Murasalat",        badge: parseInt(s.total_mura, 10),  color: "#A78BFA", desc: "circulars" },
    { href: "/admin/arz",       label: "Personal Arz",     badge: openArz,                     color: "#FB923C", desc: "requests & grievances" },
    { href: "/admin/assets",    label: "Asset Tracking",   badge: totalAssets,  color: gold, desc: "equipment & software" },
    { href: "/admin/documents", label: "Document Vault",   badge: totalDocs,      color: "#60A5FA", desc: "policies & forms" },
    { href: "/admin/lms",        label: "L&D",              badge: activeCourses, color: "#34D399", desc: "courses & training" },
    { href: "/admin/attendance", label: "Attendance",       badge: clockedToday,    color: "#22D3EE", desc: "clocked in today" },
    { href: "/admin/settings",   label: "Settings",         badge: 0,               color: mutedFaint, desc: `${totalKGs} active KGs` },
  ];

  const stats = [
    { label: "Pending Leaves",  value: pendingLeaves,  color: gold },
    { label: "Emergency",       value: emergLeaves,    color: "#F87171" },
    { label: "Open Tasks",      value: openTasks,      color: "#60A5FA" },
    { label: "Travel Pending",  value: pendingTravel,  color: "#34D399" },
    { label: "Claims Pending",  value: pendingExpenses, color: "#A78BFA" },
    { label: "Active KGs",      value: totalKGs,       color: muted },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />

      <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto sticky top-0 z-20 relative" style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: "#F59E0B" }}>
            <img src="/estate-mark.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm" style={{ color: ink }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: muted }}>Admin</span>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="text-xs transition-colors" style={{ color: mutedFaint }}>Sign Out</button>
        </form>
      </nav>

      {/* Header stats strip */}
      <div className="px-6 pb-8 pt-6 max-w-6xl mx-auto relative animate-in">
        <p className="text-xs mb-2" style={{ color: mutedFaint }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl font-bold mb-6 tracking-tight" style={{ color: ink }}>Operations Centre</h1>
        <div className="flex flex-wrap gap-2">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 flex-1 min-w-[130px]" style={glassCard}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 max-w-6xl mx-auto relative">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: mutedFaint }}>Modules</h2>
        <div className="flex flex-wrap gap-3 mb-6 animate-in animate-in-delay-1">
          {modules.map(m => (
            <Link key={m.label} href={m.href}
              className="card-hover p-4 flex items-center gap-4 flex-1 min-w-[220px]"
              style={{ ...glassCard, borderRadius: "18px" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.color + "22" }}>
                {m.badge > 0 && (
                  <span className="text-sm font-bold" style={{ color: m.color }}>{m.badge}</span>
                )}
                {m.badge === 0 && (
                  <span className="text-xs font-bold" style={{ color: m.color }}>—</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: ink }}>{m.label}</p>
                <p className="text-xs" style={{ color: muted }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 animate-in animate-in-delay-2">
          {/* Pending Leaves */}
          <div className="overflow-hidden" style={glassCard}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gold }}></div>
                <p className="text-sm font-semibold" style={{ color: ink }}>Pending Leaves</p>
              </div>
              <Link href="/admin/leaves" className="text-xs font-medium" style={{ color: gold }}>Review all →</Link>
            </div>
            {recentLeaves.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "rgba(74,222,128,0.15)" }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-sm font-medium" style={{ color: ink }}>All cleared</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {recentLeaves.map(l => (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: ink }}>{l.employee_name}</p>
                      <p className="text-xs capitalize" style={{ color: muted }}>{l.leave_type} · {fmt(l.start_date)}</p>
                    </div>
                    <Link href="/admin/leaves" className="text-xs px-3 py-1.5 rounded-lg font-medium transition-transform hover:-translate-y-px" style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#FBBF24" }}>Review</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div className="overflow-hidden" style={glassCard}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#60A5FA" }}></div>
                <p className="text-sm font-semibold" style={{ color: ink }}>Active Tasks</p>
              </div>
              <Link href="/admin/tasks" className="text-xs font-medium" style={{ color: "#60A5FA" }}>Manage →</Link>
            </div>
            {recentTasks.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "rgba(96,165,250,0.15)" }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-sm font-medium" style={{ color: ink }}>No open tasks</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {recentTasks.map(t => (
                  <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: ink }}>{t.title}</p>
                      <p className="text-xs" style={{ color: muted }}>{t.employee_name}{t.due_date ? ` · Due ${fmt(t.due_date)}` : ""}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full ml-3 capitalize font-medium shrink-0"
                      style={{ backgroundColor: t.status === "ongoing" ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)", color: t.status === "ongoing" ? "#60A5FA" : "#FBBF24" }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Murasalat */}
          {recentMura.length > 0 && (
            <div className="overflow-hidden sm:col-span-2" style={glassCard}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#A78BFA" }}></div>
                  <p className="text-sm font-semibold" style={{ color: ink }}>Recent Murasalat</p>
                </div>
                <Link href="/admin/murasalat" className="text-xs font-medium" style={{ color: "#A78BFA" }}>Manage →</Link>
              </div>
              <div className="grid sm:grid-cols-3 divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {recentMura.map((m: { id: number; title: string; priority: string; created_at: string }) => (
                  <div key={m.id} className="px-5 py-4">
                    {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Urgent</span>}
                    <p className="text-sm font-semibold" style={{ color: ink }}>{m.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>{fmt(m.created_at)}</p>
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
