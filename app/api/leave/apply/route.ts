import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

const EMERGENCY_LIMIT = 7;

function daysBetween(dateStr: string, referenceStr: string): number {
  const d = new Date(dateStr);
  const r = new Date(referenceStr);
  d.setHours(0, 0, 0, 0);
  r.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - r.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { leave_type, start_date, end_date, reason } = await request.json();

    if (!leave_type || !start_date || !end_date || !reason?.trim()) {
      return NextResponse.json({ error: "All fields including reason are required." }, { status: 400 });
    }

    if (!["emergency", "normal"].includes(leave_type)) {
      return NextResponse.json({ error: "Invalid leave type." }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    if (start_date < today) {
      return NextResponse.json({ error: "Start date cannot be in the past." }, { status: 400 });
    }

    if (end_date < start_date) {
      return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });
    }

    const daysAhead = daysBetween(start_date, today);

    if (leave_type === "normal" && daysAhead < 2) {
      return NextResponse.json({
        error: "Normal leave must be applied at least 2 days in advance. Please select Emergency Leave for urgent requests.",
        code: "ADVANCE_REQUIRED",
      }, { status: 400 });
    }

    if (leave_type === "emergency") {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const { count } = db.prepare(`
        SELECT COUNT(*) as count FROM leave_applications
        WHERE employee_id = ?
          AND leave_type = 'emergency'
          AND status NOT IN ('admin_rejected', 'super_admin_rejected')
          AND start_date BETWEEN ? AND ?
      `).get(employee.id, yearStart, yearEnd) as { count: number };

      if (count >= EMERGENCY_LIMIT) {
        return NextResponse.json({
          error: `You have used all ${EMERGENCY_LIMIT} emergency leave allowances for this year.`,
          code: "EMERGENCY_LIMIT_REACHED",
        }, { status: 400 });
      }
    }

    db.prepare(`
      INSERT INTO leave_applications (employee_id, leave_type, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(employee.id, leave_type, start_date, end_date, reason.trim());

    return NextResponse.json({ success: true, message: "Leave application submitted successfully." });
  } catch {
    return NextResponse.json({ error: "Failed to submit leave application." }, { status: 500 });
  }
}
