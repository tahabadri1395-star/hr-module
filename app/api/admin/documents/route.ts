import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`SELECT * FROM hr_documents ORDER BY category, created_at DESC`);
  return NextResponse.json({ documents: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, description, category, file_url, department } = await request.json();
  if (!title?.trim() || !category || !file_url?.trim())
    return NextResponse.json({ error: "Title, category and link are required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_documents (title, description, category, file_url, department, created_by)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [title.trim(), description?.trim() || null, category, file_url.trim(), department || null, admin.username]);

  return NextResponse.json({ success: true, document: result.rows[0] }, { status: 201 });
}
