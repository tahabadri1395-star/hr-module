import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [travelRes, reimbRes] = await Promise.all([
    query(`SELECT * FROM hr_travel_requests WHERE employee_id=$1 ORDER BY created_at DESC`, [employee.id]),
    query(`SELECT * FROM hr_reimbursements WHERE employee_id=$1 ORDER BY created_at DESC`, [employee.id]),
  ]);
  return NextResponse.json({ travel: travelRes.rows, reimbursements: reimbRes.rows });
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { travel_type, destination, purpose, travel_date, return_date, estimated_cost } = await request.json();
  if (!destination?.trim() || !purpose?.trim() || !travel_date)
    return NextResponse.json({ error: "Destination, purpose, and travel date are required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_travel_requests (employee_id, travel_type, destination, purpose, travel_date, return_date, estimated_cost)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [employee.id, travel_type || "site_visit", destination.trim(), purpose.trim(), travel_date, return_date || null, estimated_cost || null]);

  return NextResponse.json({ success: true, travel: result.rows[0] }, { status: 201 });
}
