import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { travel_id, description, amount, receipt_date, category } = await request.json();
  if (!description?.trim() || !amount || !receipt_date)
    return NextResponse.json({ error: "Description, amount, and receipt date are required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_reimbursements (employee_id, travel_id, description, amount, receipt_date, category)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [employee.id, travel_id || null, description.trim(), parseFloat(amount), receipt_date, category || "other"]);

  return NextResponse.json({ success: true, reimbursement: result.rows[0] }, { status: 201 });
}
