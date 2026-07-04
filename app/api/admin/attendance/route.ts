import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || new Date().toISOString().slice(0, 7) + "-01";
  const to   = searchParams.get("to")   || new Date().toISOString().slice(0, 10);
  const empId = searchParams.get("employee_id");

  let q = `SELECT a.*, e.name as employee_name, e.department, e.employee_code
    FROM hr_attendance a
    JOIN hr_employees e ON e.id = a.employee_id
    WHERE a.date BETWEEN $1 AND $2`;
  const params: (string | number)[] = [from, to];

  if (empId) { q += ` AND a.employee_id = $3`; params.push(parseInt(empId)); }
  q += ` ORDER BY a.date DESC, e.name`;

  const result = await query(q, params);

  // Summary per employee
  const summaryRes = await query(`
    SELECT e.id, e.name, e.department,
      COUNT(a.id) FILTER (WHERE a.status='present') as present,
      COUNT(a.id) FILTER (WHERE a.status='late') as late,
      COUNT(a.id) FILTER (WHERE a.status='absent') as absent,
      COUNT(a.id) FILTER (WHERE a.status='half_day') as half_day,
      COUNT(a.id) as total_marked
    FROM hr_employees e
    LEFT JOIN hr_attendance a ON a.employee_id=e.id AND a.date BETWEEN $1 AND $2
    WHERE e.active=1
    GROUP BY e.id ORDER BY e.name
  `, [from, to]);

  return NextResponse.json({ records: result.rows, summary: summaryRes.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { employee_id, date, status, clock_in, clock_out, notes } = await request.json();
  if (!employee_id || !date || !status) return NextResponse.json({ error: "Employee, date, status required." }, { status: 400 });

  await query(`
    INSERT INTO hr_attendance (employee_id, date, clock_in, clock_out, status, notes, marked_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (employee_id, date) DO UPDATE SET
      clock_in=EXCLUDED.clock_in, clock_out=EXCLUDED.clock_out,
      status=EXCLUDED.status, notes=EXCLUDED.notes, marked_by=EXCLUDED.marked_by
  `, [employee_id, date, clock_in || null, clock_out || null, status, notes || null, admin.username]);

  return NextResponse.json({ success: true });
}
