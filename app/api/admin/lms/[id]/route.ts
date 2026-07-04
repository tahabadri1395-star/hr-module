import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (body.action === "archive") {
    await query(`UPDATE hr_courses SET status='archived' WHERE id=$1`, [parseInt(id)]);
    return NextResponse.json({ success: true });
  }
  if (body.action === "restore") {
    await query(`UPDATE hr_courses SET status='active' WHERE id=$1`, [parseInt(id)]);
    return NextResponse.json({ success: true });
  }

  const { title, description, category, content_url, instructor, duration_hours, department } = body;
  await query(`
    UPDATE hr_courses SET
      title = COALESCE($1, title),
      description = $2,
      category = COALESCE($3, category),
      content_url = $4,
      instructor = $5,
      duration_hours = $6,
      department = $7
    WHERE id = $8
  `, [title?.trim() || null, description?.trim() || null, category || null,
      content_url?.trim() || null, instructor?.trim() || null,
      duration_hours || null, department || null, parseInt(id)]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM hr_courses WHERE id=$1`, [parseInt(id)]);
  return NextResponse.json({ success: true });
}
