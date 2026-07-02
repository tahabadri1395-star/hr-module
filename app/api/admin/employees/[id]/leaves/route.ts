import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const empResult = await query(
    "SELECT id, name, email, department, employee_code, active FROM hr_employees WHERE id = $1",
    [empId]
  );
  if (!empResult.rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const leavesResult = await query(`
    SELECT la.*, a1.username AS admin_username, a2.username AS super_admin_username
    FROM hr_leave_applications la
    LEFT JOIN hr_admins a1 ON la.admin_id = a1.id
    LEFT JOIN hr_admins a2 ON la.super_admin_id = a2.id
    WHERE la.employee_id = $1
    ORDER BY la.created_at DESC
  `, [empId]);

  const currentYear = new Date().getFullYear();
  const countResult = await query(`
    SELECT COUNT(*) as emergency_used FROM hr_leave_applications
    WHERE employee_id = $1
      AND leave_type = 'emergency'
      AND status NOT IN ('admin_rejected','super_admin_rejected')
      AND start_date BETWEEN $2 AND $3
  `, [empId, `${currentYear}-01-01`, `${currentYear}-12-31`]);

  return NextResponse.json({
    employee: empResult.rows[0],
    leaves: leavesResult.rows,
    emergency_used: parseInt(countResult.rows[0].emergency_used, 10),
  });
}
