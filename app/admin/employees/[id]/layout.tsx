import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import EmployeeDetailTabs from "@/components/EmployeeDetailTabs";

export default async function EmployeeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const empResult = await query(
    "SELECT id, name, email, department, employee_code, active FROM hr_employees WHERE id = $1",
    [empId]
  );
  const emp = empResult.rows[0];
  if (!emp) notFound();

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
        <Link href="/admin/settings" className="text-xs" style={{ color: "#64748B" }}>← Settings</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Employee header */}
        <div className="bg-white rounded-xl p-6 mb-6 flex items-center gap-5" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {emp.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold" style={{ color: "#1E293B" }}>{emp.name}</h1>
              {!emp.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Inactive</span>}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{emp.email}</p>
            <div className="flex gap-2 mt-1">
              {emp.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{emp.department}</span>}
              {emp.employee_code && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{emp.employee_code}</span>}
            </div>
          </div>
        </div>

        <EmployeeDetailTabs empId={id} />

        {children}
      </div>
    </div>
  );
}
