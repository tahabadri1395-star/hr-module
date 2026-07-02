import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const leavesResult = await query(`
    SELECT la.*,
      a1.username as admin_username,
      a2.username as super_admin_username
    FROM hr_leave_applications la
    LEFT JOIN hr_admins a1 ON la.admin_id = a1.id
    LEFT JOIN hr_admins a2 ON la.super_admin_id = a2.id
    WHERE la.employee_id = $1
    ORDER BY la.created_at DESC
  `, [employee.id]);

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const countResult = await query(`
    SELECT COUNT(*) as emergency_used FROM hr_leave_applications
    WHERE employee_id = $1
      AND leave_type = 'emergency'
      AND status NOT IN ('admin_rejected', 'super_admin_rejected')
      AND start_date BETWEEN $2 AND $3
  `, [employee.id, yearStart, yearEnd]);

  const emergency_used = parseInt(countResult.rows[0].emergency_used, 10);

  return NextResponse.json({
    leaves: leavesResult.rows,
    emergency_used,
    emergency_limit: 7,
    emergency_remaining: Math.max(0, 7 - emergency_used),
  });
}
