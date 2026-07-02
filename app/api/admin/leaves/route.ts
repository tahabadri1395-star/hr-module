import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Admin sees 'pending' leaves; super_admin sees 'admin_approved' leaves
  const targetStatus = admin.role === "super_admin" ? "admin_approved" : "pending";

  const leaves = db.prepare(`
    SELECT la.*,
      e.name as employee_name,
      e.email as employee_email,
      e.department,
      e.employee_code,
      a1.username as admin_username
    FROM leave_applications la
    JOIN employees e ON la.employee_id = e.id
    LEFT JOIN admins a1 ON la.admin_id = a1.id
    WHERE la.status = ?
    ORDER BY la.created_at ASC
  `).all(targetStatus);

  return NextResponse.json({ leaves, role: admin.role });
}
