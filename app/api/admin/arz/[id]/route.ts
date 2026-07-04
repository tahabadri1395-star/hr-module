import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { status, admin_response } = await request.json();

  const result = await query(`
    UPDATE hr_arz SET
      status = COALESCE($1, status),
      admin_response = COALESCE($2, admin_response),
      responded_by = $3,
      responded_at = NOW()
    WHERE id = $4 RETURNING *
  `, [status || null, admin_response || null, admin.username, parseInt(id)]);

  if (!result.rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ success: true, arz: result.rows[0] });
}
