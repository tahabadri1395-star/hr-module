import { getEmployeeFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import ClockInOutCard from "@/components/mobile/ClockInOutCard";
import ModuleGrid from "@/components/mobile/ModuleGrid";
import StatStrip from "@/components/mobile/StatStrip";

export default async function MobileDashboardPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/m/login");

  const yr = new Date().getFullYear();
  const [leavesRes, emergRes, muraRes, arzRes] = await Promise.all([
    query(`SELECT status FROM hr_leave_applications WHERE employee_id=$1`, [employee.id]),
    query(`SELECT COUNT(*) as used FROM hr_leave_applications WHERE employee_id=$1 AND leave_type='emergency' AND status NOT IN ('admin_rejected','super_admin_rejected') AND start_date BETWEEN $2 AND $3`, [employee.id, `${yr}-01-01`, `${yr}-12-31`]),
    query(`SELECT CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read FROM hr_murasalat m LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id=m.id AND mr.employee_id=$1 WHERE m.department IS NULL OR m.department=(SELECT department FROM hr_employees WHERE id=$1)`, [employee.id]),
    query(`SELECT COUNT(*) as open FROM hr_arz WHERE employee_id=$1 AND status IN ('open','in_progress')`, [employee.id]),
  ]);

  const pendingLeaves = leavesRes.rows.filter(l => l.status === "pending" || l.status === "admin_approved").length;
  const emergLeft = Math.max(0, 7 - parseInt(emergRes.rows[0].used, 10));
  const unreadMura = muraRes.rows.filter(m => !m.is_read).length;
  const openArz = parseInt(arzRes.rows[0].open, 10);

  return (
    <div className="space-y-5 pb-2">
      <ClockInOutCard />
      <StatStrip
        items={[
          { label: "Pending Leave", value: pendingLeaves },
          { label: "Emergency Left", value: emergLeft },
          { label: "Unread Circulars", value: unreadMura },
          { label: "Open Arz", value: openArz },
        ]}
      />
      <ModuleGrid />
    </div>
  );
}
