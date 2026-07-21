import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(req);
  const employee = token ? await verifyEmployeeToken(token) : null;
  if (!employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await query(`SELECT * FROM hr_expenses WHERE id=$1 AND employee_id=$2`, [id, employee.id]);
  if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (res.rows[0].status !== "pending") return NextResponse.json({ error: "Only pending claims can be withdrawn." }, { status: 400 });

  await query(`DELETE FROM hr_expenses WHERE id=$1`, [id]);
  return NextResponse.json({ success: true });
}
