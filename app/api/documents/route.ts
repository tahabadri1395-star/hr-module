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
    SELECT * FROM hr_documents
    WHERE department IS NULL OR department = $1
    ORDER BY category, created_at DESC
  `, [dept ?? ""]);

  return NextResponse.json({ documents: result.rows });
}
