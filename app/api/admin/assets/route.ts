import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const assetsRes = await query(`
    SELECT a.*,
      aa.id as assignment_id, aa.employee_id, aa.assigned_at, aa.notes as assignment_notes,
      e.name as employee_name, e.department
    FROM hr_assets a
    LEFT JOIN hr_asset_assignments aa ON aa.asset_id = a.id AND aa.status = 'active'
    LEFT JOIN hr_employees e ON e.id = aa.employee_id
    ORDER BY a.asset_type, a.name
  `);

  return NextResponse.json({ assets: assetsRes.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { name, asset_type, serial_number, license_key, description } = await request.json();
  if (!name?.trim() || !asset_type) return NextResponse.json({ error: "Name and type are required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_assets (name, asset_type, serial_number, license_key, description)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [name.trim(), asset_type, serial_number?.trim() || null, license_key?.trim() || null, description?.trim() || null]);

  return NextResponse.json({ success: true, asset: result.rows[0] }, { status: 201 });
}
