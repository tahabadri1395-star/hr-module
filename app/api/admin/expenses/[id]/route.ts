import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(req);
  const admin = token ? await verifyAdminToken(token) : null;
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, admin_note } = await req.json();

  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const res = await query(
    `UPDATE hr_expenses SET status=$1, admin_note=$2, approved_by=$3, approved_at=NOW()
     WHERE id=$4 RETURNING *`,
    [status, admin_note?.trim() || null, admin.username, id]
  );
  if (res.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(req);
  const admin = token ? await verifyAdminToken(token) : null;
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM hr_expenses WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
