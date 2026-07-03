import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  if (!["pending", "ongoing", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const completedAt = status === "completed" ? "NOW()" : "NULL";

  const result = await query(
    `UPDATE hr_tasks SET status=$1, completed_at=${completedAt}, updated_at=NOW()
     WHERE id=$2 AND assigned_to=$3 RETURNING *`,
    [status, parseInt(id), employee.id]
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ success: true, task: result.rows[0] });
}
