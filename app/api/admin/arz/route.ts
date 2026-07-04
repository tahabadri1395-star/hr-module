import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT a.*, e.name as employee_name, e.department, e.employee_code
    FROM hr_arz a
    JOIN hr_employees e ON e.id = a.employee_id
    ORDER BY
      CASE a.priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
      a.created_at DESC
  `);
  return NextResponse.json({ arz: result.rows });
}
