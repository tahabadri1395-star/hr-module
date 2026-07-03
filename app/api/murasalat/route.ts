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
    SELECT m.*,
      CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read
    FROM hr_murasalat m
    LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id=m.id AND mr.employee_id=$1
    WHERE m.department IS NULL OR m.department=$2
    ORDER BY m.created_at DESC
  `, [employee.id, dept ?? ""]);

  return NextResponse.json({ murasalat: result.rows });
}
