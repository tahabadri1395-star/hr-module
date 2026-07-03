import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { status, admin_note } = await request.json();
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const result = await query(`
    UPDATE hr_reimbursements SET status=$1, admin_note=$2, approved_by=$3, approved_at=NOW()
    WHERE id=$4 RETURNING *
  `, [status, admin_note || null, admin.username, parseInt(id)]);

  if (!result.rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ success: true, reimbursement: result.rows[0] });
}
