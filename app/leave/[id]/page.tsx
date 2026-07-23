import { redirect, notFound } from "next/navigation";
import { getEmployeeFromCookies } from "@/lib/auth";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  admin_approved: "Admin Approved — Awaiting Final Approval",
  approved: "Approved",
  admin_rejected: "Rejected by Admin",
  super_admin_rejected: "Rejected by HR",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#B45309",
  admin_approved: "#1D4ED8",
  approved: "#15803D",
  admin_rejected: "#DC2626",
  super_admin_rejected: "#DC2626",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function dayCount(start: string, end: string, isHalfDay: boolean) {
  if (isHalfDay) return "0.5";
  return String(Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}

export default async function LeaveSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaveId = parseInt(id);
  if (isNaN(leaveId)) notFound();

  // Allow access to employee (own leave) or any admin
  const employee = await getEmployeeFromCookies();
  const admin = await getAdminFromCookies();
  if (!employee && !admin) redirect("/login");

  const result = await query(`
    SELECT la.*, e.name AS employee_name, e.email, e.department, e.employee_code
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    WHERE la.id = $1
  `, [leaveId]);

  const leave = result.rows[0];
  if (!leave) notFound();

  // Employees can only view their own slips
  if (employee && !admin && leave.employee_id !== employee.id) notFound();

  const days = dayCount(leave.start_date, leave.end_date, !!leave.is_half_day);
  const backUrl = admin ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Nav — hidden on print */}
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between print:hidden sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.print()}
            className="text-xs px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            Print / Save PDF
          </button>
          <Link href={backUrl} className="text-xs" style={{ color: "#64748B" }}>← Back</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Slip */}
        <div className="bg-white rounded-xl p-10 animate-in" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* Header */}
          <div className="text-center border-b pb-6 mb-6" style={{ borderColor: "#F1F5F9" }}>
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M9 13h6M9 16h4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>Leave Application Slip</h1>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Ref # LA-{String(leave.id).padStart(4, "0")}</p>
          </div>

          {/* Status badge */}
          <div className="text-center mb-6">
            <span className="text-sm font-semibold px-4 py-2 rounded-full"
              style={{
                backgroundColor: `${STATUS_COLORS[leave.status]}18`,
                color: STATUS_COLORS[leave.status],
              }}>
              {STATUS_LABELS[leave.status] ?? leave.status}
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {[
              { label: "Khidmat Guzar", value: leave.employee_name },
              { label: "Email", value: leave.email },
              { label: "Department", value: leave.department ?? "—" },
              { label: "Employee Code", value: leave.employee_code ?? "—" },
              { label: "Leave Type", value: leave.leave_type === "emergency" ? "Emergency Leave" : "Normal Leave" },
              { label: "Duration", value: leave.is_half_day ? `Half Day — ${leave.half_day_period ?? ""}` : `${days} day${days !== "1" ? "s" : ""}` },
              { label: "From", value: formatDate(leave.start_date) },
              { label: "To", value: leave.is_half_day ? formatDate(leave.start_date) : formatDate(leave.end_date) },
              { label: "Applied On", value: formatDate(leave.created_at) },
            ].map(f => (
              <div key={f.label} className="flex gap-4 py-2.5 border-b" style={{ borderColor: "#F8FAFC" }}>
                <span className="text-xs font-medium w-36 shrink-0 mt-0.5" style={{ color: "#94A3B8" }}>{f.label}</span>
                <span className="text-sm" style={{ color: "#1E293B" }}>{f.value}</span>
              </div>
            ))}

            <div className="py-2.5">
              <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Reason</span>
              <p className="mt-1 text-sm" style={{ color: "#1E293B" }}>{leave.reason}</p>
            </div>

            {leave.admin_note && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#1D4ED8" }}>Admin Note</p>
                <p className="text-sm" style={{ color: "#1E293B" }}>{leave.admin_note}</p>
              </div>
            )}

            {leave.super_admin_note && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0FDF4" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#15803D" }}>HR Note</p>
                <p className="text-sm" style={{ color: "#1E293B" }}>{leave.super_admin_note}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t text-center" style={{ borderColor: "#F1F5F9" }}>
            <p className="text-xs" style={{ color: "#94A3B8" }}>This is an official leave record generated by HR Module.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          nav { display: none !important; }
          .max-w-2xl { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
