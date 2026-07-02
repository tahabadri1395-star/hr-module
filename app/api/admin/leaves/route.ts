import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const targetStatus = admin.role === "super_admin" ? "admin_approved" : "pending";

  const result = await query(`
    SELECT la.*,
      e.name as employee_name,
      e.email as employee_email,
      e.department,
      e.employee_code,
      a1.username as admin_username
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    LEFT JOIN hr_admins a1 ON la.admin_id = a1.id
    WHERE la.status = $1
    ORDER BY la.created_at ASC
  `, [targetStatus]);

  return NextResponse.json({ leaves: result.rows, role: admin.role });
}
