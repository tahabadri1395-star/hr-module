import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { rid } = await params;
  await query("DELETE FROM hr_test_results WHERE id = $1", [parseInt(rid)]);
  return NextResponse.json({ success: true });
}
