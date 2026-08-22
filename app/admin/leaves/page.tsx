import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import LeaveActionButtons from "@/components/LeaveActionButtons";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface LeaveWithEmployee {
  id: number; leave_type: string; start_date: string; end_date: string;
  is_half_day: boolean; half_day_period: string | null; reason: string;
  status: string; created_at: string; employee_id: number;
  employee_name: string; employee_email: string; department: string | null; employee_code: string | null;
}

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
  normal:    { label: "Normal",    bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dayCount(start: string, end: string, isHalfDay: boolean) {
  if (isHalfDay) return "0.5 days";
  const n = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return `${n} day${n !== 1 ? "s" : ""}`;
}

export default async function AdminLeavesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin") redirect("/admin/super");

  const sp = await searchParams;
  const q = sp.q?.toLowerCase() ?? "";
  const typeFilter = sp.type ?? "all";

  const result = await query(`
    SELECT la.*, e.id as employee_id,
      e.name as employee_name, e.email as employee_email,
      e.department, e.employee_code
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    WHERE la.status = 'pending'
    ORDER BY la.created_at ASC
  `);

  let leaves = result.rows as LeaveWithEmployee[];
  if (q) leaves = leaves.filter(l =>
    l.employee_name.toLowerCase().includes(q) ||
    l.employee_email.toLowerCase().includes(q) ||
    (l.department ?? "").toLowerCase().includes(q)
  );
  if (typeFilter !== "all") leaves = leaves.filter(l => l.leave_type === typeFilter);

  const allLeaves = result.rows as LeaveWithEmployee[];
  const emergencyCount = allLeaves.filter(l => l.leave_type === "emergency").length;

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <img src="/estate-mark-white.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
          <a href="/api/admin/leaves/export" className="text-xs" style={{ color: gold }}>Export CSV</a>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: mutedFaint }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: ink }}>Leave Approvals</h1>
          <p className="text-sm mt-1" style={{ color: muted }}>First-level review — approved applications proceed to Super Admin</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Review", value: allLeaves.length, color: gold },
            { label: "Emergency",      value: emergencyCount,   color: "#FB7185" },
            { label: "Normal",         value: allLeaves.length - emergencyCount, color: "#93C5FD" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-5 py-4" style={glassCard}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <form method="GET" action="/admin/leaves" className="flex gap-3 flex-1">
            <input name="q" defaultValue={q} placeholder="Search by name, email, department…"
              className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
              style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink }} />
            <input type="hidden" name="type" value={typeFilter} />
            <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: gold, color: "#1B1630" }}>Search</button>
          </form>
          <div className="flex gap-2">
            {[["all","All"],["normal","Normal"],["emergency","Emergency"]].map(([val, label]) => (
              <Link key={val} href={`/admin/leaves?type=${val}${q ? `&q=${q}` : ""}`}
                className="text-xs px-3 py-2.5 rounded-lg border font-medium"
                style={typeFilter === val
                  ? { borderColor: gold, backgroundColor: "rgba(217,180,108,0.15)", color: gold }
                  : { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "transparent", color: muted }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-5 px-5 py-3 rounded-xl border flex items-center gap-2 text-xs overflow-x-auto"
          style={{ ...glassPill, borderRadius: "16px", color: muted }}>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "rgba(217,180,108,0.15)", color: gold }}>Pending</span>
          <span>→</span>
          <span className="font-medium" style={{ color: ink }}>Your Approval</span>
          <span>→</span>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "rgba(96,165,250,0.15)", color: "#93C5FD" }}>Admin Approved</span>
          <span>→</span>
          <span className="font-medium" style={{ color: ink }}>Super Admin</span>
          <span>→</span>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>Approved</span>
        </div>

        {leaves.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={glassCard}>
            <p className="font-medium text-sm mb-1" style={{ color: ink }}>
              {q || typeFilter !== "all" ? "No results match your filter." : "No pending applications"}
            </p>
            <p className="text-xs" style={{ color: mutedFaint }}>
              {!q && typeFilter === "all" ? "All leave requests have been reviewed." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => {
              const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
              return (
                <div key={leave.id} className="rounded-xl p-5" style={glassCard}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                          {leave.employee_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: ink }}>{leave.employee_name}</p>
                            <Link href={`/admin/employees/${leave.employee_id}/leaves`} className="text-xs" style={{ color: gold }}>History</Link>
                          </div>
                          <p className="text-xs" style={{ color: mutedFaint }}>
                            {leave.employee_code && <span>{leave.employee_code} · </span>}
                            {leave.employee_email}
                            {leave.department && <span> · {leave.department}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>{lm.label} Leave</span>
                        <span className="text-xs" style={{ color: muted }}>
                          {fmt(leave.start_date)}{!leave.is_half_day ? ` — ${fmt(leave.end_date)}` : ""}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" style={glassPill}>
                          {dayCount(leave.start_date, leave.end_date, leave.is_half_day)}
                          {leave.half_day_period ? ` · ${leave.half_day_period}` : ""}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: muted }}>Reason</p>
                        <p className="text-sm" style={{ color: ink }}>{leave.reason}</p>
                      </div>
                      <LeaveActionButtons leaveId={leave.id} role="admin" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: mutedFaint }}>Applied</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: muted }}>{fmt(leave.created_at)}</p>
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
