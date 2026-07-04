import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM hr_documents WHERE id=$1`, [parseInt(id)]);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { title, description, category, file_url, department } = await request.json();
  await query(`
    UPDATE hr_documents SET
      title = COALESCE($1, title),
      description = $2,
      category = COALESCE($3, category),
      file_url = COALESCE($4, file_url),
      department = $5
    WHERE id = $6
  `, [title?.trim() || null, description?.trim() || null, category || null, file_url?.trim() || null, department || null, parseInt(id)]);

  return NextResponse.json({ success: true });
}
