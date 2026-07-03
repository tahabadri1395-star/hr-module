import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const res = await query(`SELECT * FROM hr_travel_requests WHERE id=$1 AND employee_id=$2`, [parseInt(id), employee.id]);
  if (!res.rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (res.rows[0].status !== "pending") return NextResponse.json({ error: "Only pending requests can be withdrawn." }, { status: 400 });

  await query(`DELETE FROM hr_travel_requests WHERE id=$1`, [parseInt(id)]);
  return NextResponse.json({ success: true });
}
