import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

const LATE_HOUR = 9;
const LATE_MIN  = 30;

function computeStatus(clockIn: string): "present" | "late" {
  const [h, m] = clockIn.split(":").map(Number);
  return h > LATE_HOUR || (h === LATE_HOUR && m > LATE_MIN) ? "late" : "present";
}

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

  const [todayRes, monthRes] = await Promise.all([
    query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date=$2`,
      [employee.id, new Date().toISOString().slice(0, 10)]),
    query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date LIKE $2 ORDER BY date ASC`,
      [employee.id, `${month}%`]),
  ]);

  return NextResponse.json({ today: todayRes.rows[0] || null, records: monthRes.rows });
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { action } = await request.json(); // "clock_in" | "clock_out"
  const today = new Date().toISOString().slice(0, 10);
  const timeNow = new Date().toTimeString().slice(0, 5); // HH:MM

  const existing = await query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date=$2`, [employee.id, today]);

  if (action === "clock_in") {
    if (existing.rows.length) return NextResponse.json({ error: "Already clocked in today." }, { status: 400 });
    const status = computeStatus(timeNow);
    await query(
      `INSERT INTO hr_attendance (employee_id, date, clock_in, status) VALUES ($1,$2,$3,$4)`,
      [employee.id, today, timeNow, status]
    );
    return NextResponse.json({ success: true, status, clock_in: timeNow });
  }

  if (action === "clock_out") {
    if (!existing.rows.length) return NextResponse.json({ error: "Not clocked in yet." }, { status: 400 });
    if (existing.rows[0].clock_out) return NextResponse.json({ error: "Already clocked out." }, { status: 400 });
    await query(`UPDATE hr_attendance SET clock_out=$1 WHERE employee_id=$2 AND date=$3`, [timeNow, employee.id, today]);
    return NextResponse.json({ success: true, clock_out: timeNow });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
