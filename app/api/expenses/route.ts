import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getEmployeeTokenFromRequest(req);
  const employee = token ? await verifyEmployeeToken(token) : null;
  if (!employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const params: unknown[] = [employee.id];
  let where = "WHERE e.employee_id=$1";
  if (status && status !== "all") { where += " AND e.status=$2"; params.push(status); }

  const res = await query(
    `SELECT e.* FROM hr_expenses e ${where} ORDER BY e.created_at DESC`,
    params
  );
  return NextResponse.json(res.rows);
}

export async function POST(req: NextRequest) {
  const token = getEmployeeTokenFromRequest(req);
  const employee = token ? await verifyEmployeeToken(token) : null;
  if (!employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, category, amount, receipt_url, expense_date, travel_id } = await req.json();
  if (!title?.trim() || !category || !amount || !expense_date)
    return NextResponse.json({ error: "Title, category, amount and date are required" }, { status: 400 });

  const res = await query(
    `INSERT INTO hr_expenses (employee_id, title, description, category, amount, receipt_url, expense_date, travel_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [employee.id, title.trim(), description?.trim() || null, category, parseFloat(amount), receipt_url?.trim() || null, expense_date, travel_id || null]
  );
  return NextResponse.json(res.rows[0], { status: 201 });
}
