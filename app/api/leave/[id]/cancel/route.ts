import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const leaveId = parseInt(id);
  if (isNaN(leaveId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const result = await query(
    "SELECT id, status, employee_id FROM hr_leave_applications WHERE id = $1",
    [leaveId]
  );
  const leave = result.rows[0];

  if (!leave) return NextResponse.json({ error: "Leave not found." }, { status: 404 });
  if (leave.employee_id !== employee.id) return NextResponse.json({ error: "Not your leave." }, { status: 403 });
  if (leave.status !== "pending") return NextResponse.json({ error: "Only pending leaves can be cancelled." }, { status: 400 });

  await query("DELETE FROM hr_leave_applications WHERE id = $1", [leaveId]);
  return NextResponse.json({ success: true });
}
