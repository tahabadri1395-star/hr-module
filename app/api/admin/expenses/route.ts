import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const token = getAdminTokenFromRequest(req);
  const admin = token ? verifyAdminToken(token) : null;
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "all";
  const empId  = req.nextUrl.searchParams.get("employee_id");

  let where = "WHERE 1=1";
  const params: unknown[] = [];
  if (status !== "all") { where += ` AND e.status=$${params.length + 1}`; params.push(status); }
  if (empId)            { where += ` AND e.employee_id=$${params.length + 1}`; params.push(empId); }

  const res = await query(
    `SELECT e.*, emp.name as employee_name, emp.department, emp.employee_code
     FROM hr_expenses e
     JOIN hr_employees emp ON emp.id = e.employee_id
     ${where}
     ORDER BY CASE e.status WHEN 'pending' THEN 0 ELSE 1 END, e.created_at DESC`,
    params
  );

  const statsRes = await query(`SELECT
    (SELECT COUNT(*) FROM hr_expenses WHERE status='pending')  as pending,
    (SELECT COUNT(*) FROM hr_expenses WHERE status='approved') as approved,
    (SELECT COUNT(*) FROM hr_expenses WHERE status='rejected') as rejected,
    (SELECT COALESCE(SUM(amount),0) FROM hr_expenses WHERE status='approved') as total_approved_amount`);

  return NextResponse.json({ expenses: res.rows, stats: statsRes.rows[0] });
}
