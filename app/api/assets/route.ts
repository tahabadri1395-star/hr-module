import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT a.*, aa.assigned_at, aa.notes, aa.id as assignment_id
    FROM hr_asset_assignments aa
    JOIN hr_assets a ON a.id = aa.asset_id
    WHERE aa.employee_id = $1 AND aa.status = 'active'
    ORDER BY aa.assigned_at DESC
  `, [employee.id]);

  return NextResponse.json({ assets: result.rows });
}
