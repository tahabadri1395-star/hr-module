import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import LeaveActionButtons from "@/components/LeaveActionButtons";

interface LeaveWithEmployee {
  id: number; leave_type: string; start_date: string; end_date: string;
  is_half_day: boolean; half_day_period: string | null; reason: string;
  status: string; created_at: string; employee_id: number;
  employee_name: string; employee_email: string; department: string | null; employee_code: string | null;
}

const LEAVE_META: Record<string, { label: string; bg: string; color: string }> = {
  emergency: { label: "Emergency", bg: "#FFF1F2", color: "#E11D48" },
  normal:    { label: "Normal",    bg: "#EEF2FF", color: "#4338CA" },
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
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin" className="text-xs" style={{ color: "#64748B" }}>← Dashboard</Link>
          <a href="/api/admin/leaves/export" className="text-xs" style={{ color: "#4F46E5" }}>Export CSV</a>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "#94A3B8" }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Leave Approvals</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>First-level review — approved applications proceed to Super Admin</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending Review", value: allLeaves.length, color: "#B45309" },
            { label: "Emergency",      value: emergencyCount,   color: "#E11D48" },
            { label: "Normal",         value: allLeaves.length - emergencyCount, color: "#4338CA" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <form method="GET" action="/admin/leaves" className="flex gap-3 flex-1">
            <input name="q" defaultValue={q} placeholder="Search by name, email, department…"
              className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
            <input type="hidden" name="type" value={typeFilter} />
            <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>Search</button>
          </form>
          <div className="flex gap-2">
            {[["all","All"],["normal","Normal"],["emergency","Emergency"]].map(([val, label]) => (
              <Link key={val} href={`/admin/leaves?type=${val}${q ? `&q=${q}` : ""}`}
                className="text-xs px-3 py-2.5 rounded-lg border font-medium"
                style={{
                  borderColor: typeFilter === val ? "#4F46E5" : "#E2E8F0",
                  backgroundColor: typeFilter === val ? "#EEF2FF" : "white",
                  color: typeFilter === val ? "#4338CA" : "#64748B",
                }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-5 px-5 py-3 rounded-xl border flex items-center gap-2 text-xs overflow-x-auto"
          style={{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>Pending</span>
          <span>→</span>
          <span className="font-medium" style={{ color: "#1E293B" }}>Your Approval</span>
          <span>→</span>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Admin Approved</span>
          <span>→</span>
          <span className="font-medium" style={{ color: "#1E293B" }}>Super Admin</span>
          <span>→</span>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>Approved</span>
        </div>

        {leaves.length === 0 ? (
          <div className="bg-white rounded-xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="font-medium text-sm mb-1" style={{ color: "#1E293B" }}>
              {q || typeFilter !== "all" ? "No results match your filter." : "No pending applications"}
            </p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              {!q && typeFilter === "all" ? "All leave requests have been reviewed." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => {
              const lm = LEAVE_META[leave.leave_type] ?? LEAVE_META.normal;
              return (
                <div key={leave.id} className="card-hover bg-white rounded-xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                          {leave.employee_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{leave.employee_name}</p>
                            <Link href={`/admin/employees/${leave.employee_id}/leaves`} className="text-xs" style={{ color: "#4F46E5" }}>History</Link>
                          </div>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>
                            {leave.employee_code && <span>{leave.employee_code} · </span>}
                            {leave.employee_email}
                            {leave.department && <span> · {leave.department}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lm.bg, color: lm.color }}>{lm.label} Leave</span>
                        <span className="text-xs" style={{ color: "#64748B" }}>
                          {fmt(leave.start_date)}{!leave.is_half_day ? ` — ${fmt(leave.end_date)}` : ""}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
                          {dayCount(leave.start_date, leave.end_date, leave.is_half_day)}
                          {leave.half_day_period ? ` · ${leave.half_day_period}` : ""}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: "#F8FAFC" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#64748B" }}>Reason</p>
                        <p className="text-sm" style={{ color: "#1E293B" }}>{leave.reason}</p>
                      </div>
                      <LeaveActionButtons leaveId={leave.id} role="admin" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs" style={{ color: "#94A3B8" }}>Applied</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#64748B" }}>{fmt(leave.created_at)}</p>
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
