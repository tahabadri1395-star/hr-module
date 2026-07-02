import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const leaves = db.prepare(`
    SELECT la.*,
      a1.username as admin_username,
      a2.username as super_admin_username
    FROM leave_applications la
    LEFT JOIN admins a1 ON la.admin_id = a1.id
    LEFT JOIN admins a2 ON la.super_admin_id = a2.id
    WHERE la.employee_id = ?
    ORDER BY la.created_at DESC
  `).all(employee.id);

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { emergency_used } = db.prepare(`
    SELECT COUNT(*) as emergency_used FROM leave_applications
    WHERE employee_id = ?
      AND leave_type = 'emergency'
      AND status NOT IN ('admin_rejected', 'super_admin_rejected')
      AND start_date BETWEEN ? AND ?
  `).get(employee.id, yearStart, yearEnd) as { emergency_used: number };

  return NextResponse.json({
    leaves,
    emergency_used,
    emergency_limit: 7,
    emergency_remaining: Math.max(0, 7 - emergency_used),
  });
}
