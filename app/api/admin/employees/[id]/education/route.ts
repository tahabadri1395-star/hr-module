import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { institution, degree, field, year_from, year_to, status } = await request.json();
  if (!institution?.trim()) return NextResponse.json({ error: "Institution is required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_employee_education (employee_id, institution, degree, field, year_from, year_to, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [parseInt(id), institution.trim(), degree||null, field||null, year_from||null, year_to||null, status||"completed"]);

  return NextResponse.json({ success: true, record: result.rows[0] }, { status: 201 });
}
