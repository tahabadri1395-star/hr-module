import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const courseId = parseInt(id);
  const { status, score } = await request.json();

  const startedAt  = status === "in_progress" ? "NOW()" : "started_at";
  const completedAt = status === "completed"   ? "NOW()" : "completed_at";

  await query(`
    INSERT INTO hr_course_progress (course_id, employee_id, status, started_at, completed_at, score)
    VALUES ($1, $2, $3,
      ${status === "in_progress" ? "NOW()" : "NULL"},
      ${status === "completed"   ? "NOW()" : "NULL"},
      $4)
    ON CONFLICT (course_id, employee_id) DO UPDATE SET
      status = EXCLUDED.status,
      started_at  = CASE WHEN hr_course_progress.started_at IS NULL THEN ${startedAt} ELSE hr_course_progress.started_at END,
      completed_at = CASE WHEN $3='completed' THEN ${completedAt} ELSE hr_course_progress.completed_at END,
      score = COALESCE($4, hr_course_progress.score)
  `, [courseId, employee.id, status, score ?? null]);

  return NextResponse.json({ success: true });
}
