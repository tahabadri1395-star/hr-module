import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import EmployeeDetailTabs from "@/components/EmployeeDetailTabs";
import { adminPageBg, ARCH_PATTERN, ink, muted, glassCard, glassPill } from "@/lib/desktop-theme";

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
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <img src="/estate-mark-white.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/admin/settings" className="text-xs" style={{ color: muted }}>← Settings</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        {/* Employee header */}
        <div className="rounded-xl p-6 mb-6 flex items-center gap-5" style={glassCard}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {emp.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold" style={{ color: ink }}>{emp.name}</h1>
              {!emp.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Inactive</span>}
            </div>
            <p className="text-sm mt-0.5" style={{ color: muted }}>{emp.email}</p>
            <div className="flex gap-2 mt-1">
              {emp.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(96,165,250,0.15)", color: "#93C5FD" }}>{emp.department}</span>}
              {emp.employee_code && <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{emp.employee_code}</span>}
            </div>
          </div>
        </div>

        <EmployeeDetailTabs empId={id} />

        {children}
      </div>
    </div>
  );
}
