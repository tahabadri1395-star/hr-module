import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [travelRes, reimbRes] = await Promise.all([
    query(`SELECT t.*, e.name as employee_name, e.department, e.employee_code FROM hr_travel_requests t JOIN hr_employees e ON e.id=t.employee_id ORDER BY t.created_at DESC`),
    query(`SELECT r.*, e.name as employee_name, e.department FROM hr_reimbursements r JOIN hr_employees e ON e.id=r.employee_id ORDER BY r.created_at DESC`),
  ]);
  return NextResponse.json({ travel: travelRes.rows, reimbursements: reimbRes.rows });
}
