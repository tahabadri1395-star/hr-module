import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { test_name, score, date, remarks } = await request.json();
  if (!test_name?.trim()) return NextResponse.json({ error: "Test name is required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_test_results (employee_id, test_name, score, date, remarks)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [parseInt(id), test_name.trim(), score||null, date||null, remarks||null]);

  return NextResponse.json({ success: true, record: result.rows[0] }, { status: 201 });
}
