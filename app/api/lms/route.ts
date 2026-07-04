import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const empRes = await query(`SELECT department FROM hr_employees WHERE id=$1`, [employee.id]);
  const dept = empRes.rows[0]?.department ?? null;

  const result = await query(`
    SELECT c.*,
      COALESCE(cp.status, 'not_started') as my_status,
      cp.started_at, cp.completed_at, cp.score
    FROM hr_courses c
    LEFT JOIN hr_course_progress cp ON cp.course_id = c.id AND cp.employee_id = $1
    WHERE c.status = 'active' AND (c.department IS NULL OR c.department = $2)
    ORDER BY c.category, c.created_at DESC
  `, [employee.id, dept ?? ""]);

  return NextResponse.json({ courses: result.rows });
}
