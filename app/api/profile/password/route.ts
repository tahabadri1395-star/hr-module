import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
  }

  if (new_password.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const result = await query("SELECT password_hash FROM hr_employees WHERE id = $1", [employee.id]);
  const row = result.rows[0];

  if (!row || !(await bcrypt.compare(current_password, row.password_hash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const newHash = await bcrypt.hash(new_password, 10);
  await query("UPDATE hr_employees SET password_hash = $1 WHERE id = $2", [newHash, employee.id]);

  return NextResponse.json({ success: true });
}
