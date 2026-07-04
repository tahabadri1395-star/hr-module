import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(
    `SELECT * FROM hr_arz WHERE employee_id=$1 ORDER BY created_at DESC`,
    [employee.id]
  );
  return NextResponse.json({ arz: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { category, subject, body, priority } = await request.json();
  if (!category || !subject?.trim() || !body?.trim())
    return NextResponse.json({ error: "Category, subject and body are required." }, { status: 400 });

  const result = await query(
    `INSERT INTO hr_arz (employee_id, category, subject, body, priority)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [employee.id, category, subject.trim(), body.trim(), priority || "normal"]
  );
  return NextResponse.json({ success: true, arz: result.rows[0] }, { status: 201 });
}
