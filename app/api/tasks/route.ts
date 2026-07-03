import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT * FROM hr_tasks
    WHERE assigned_to = $1
    ORDER BY
      CASE status WHEN 'ongoing' THEN 1 WHEN 'pending' THEN 2 WHEN 'completed' THEN 3 END,
      created_at DESC
  `, [employee.id]);

  return NextResponse.json({ tasks: result.rows });
}
