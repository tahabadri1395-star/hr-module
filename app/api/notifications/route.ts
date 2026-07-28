import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(
    `SELECT * FROM hr_notifications WHERE employee_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [employee.id]
  );
  const unreadResult = await query(
    `SELECT COUNT(*) FROM hr_notifications WHERE employee_id=$1 AND read_at IS NULL`,
    [employee.id]
  );

  return NextResponse.json({
    notifications: result.rows,
    unread_count: parseInt(unreadResult.rows[0].count, 10),
  });
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  await query(
    `UPDATE hr_notifications SET read_at=NOW() WHERE employee_id=$1 AND read_at IS NULL`,
    [employee.id]
  );
  return NextResponse.json({ success: true });
}
