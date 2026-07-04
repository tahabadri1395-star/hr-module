import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const assetId = parseInt(id);
  const body = await request.json();

  // Assign to employee
  if (body.action === "assign") {
    const { employee_id, notes } = body;
    if (!employee_id) return NextResponse.json({ error: "Employee required." }, { status: 400 });

    // Check not already assigned
    const existing = await query(`SELECT id FROM hr_asset_assignments WHERE asset_id=$1 AND status='active'`, [assetId]);
    if (existing.rows.length) return NextResponse.json({ error: "Asset already assigned." }, { status: 400 });

    await query(`INSERT INTO hr_asset_assignments (asset_id, employee_id, assigned_by, notes) VALUES ($1,$2,$3,$4)`,
      [assetId, employee_id, admin.username, notes || null]);
    await query(`UPDATE hr_assets SET status='assigned' WHERE id=$1`, [assetId]);
    return NextResponse.json({ success: true });
  }

  // Return from employee
  if (body.action === "return") {
    await query(`UPDATE hr_asset_assignments SET status='returned', returned_at=NOW() WHERE asset_id=$1 AND status='active'`, [assetId]);
    await query(`UPDATE hr_assets SET status='available' WHERE id=$1`, [assetId]);
    return NextResponse.json({ success: true });
  }

  // Update status (maintenance/retired/available)
  if (body.action === "status") {
    await query(`UPDATE hr_assets SET status=$1 WHERE id=$2`, [body.status, assetId]);
    return NextResponse.json({ success: true });
  }

  // Edit asset details
  const { name, serial_number, license_key, description } = body;
  await query(`UPDATE hr_assets SET name=COALESCE($1,name), serial_number=$2, license_key=$3, description=$4 WHERE id=$5`,
    [name?.trim() || null, serial_number?.trim() || null, license_key?.trim() || null, description?.trim() || null, assetId]);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM hr_assets WHERE id=$1`, [parseInt(id)]);
  return NextResponse.json({ success: true });
}
