import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT m.*,
      (SELECT COUNT(*) FROM hr_murasalat_reads WHERE murasalat_id=m.id) as read_count,
      (SELECT COUNT(*) FROM hr_employees WHERE active=1) as total_kgs
    FROM hr_murasalat m
    ORDER BY m.created_at DESC
  `);
  return NextResponse.json({ murasalat: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, body, department, priority } = await request.json();
  if (!title?.trim() || !body?.trim())
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_murasalat (title, body, department, priority, created_by)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [title.trim(), body.trim(), department || null, priority || "normal", admin.username]);

  return NextResponse.json({ success: true, murasalat: result.rows[0] }, { status: 201 });
}
