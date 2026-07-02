import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

interface LeaveApp {
  id: number;
  status: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const leaveId = parseInt(id);
  if (isNaN(leaveId)) return NextResponse.json({ error: "Invalid leave ID." }, { status: 400 });

  const { action, note } = await request.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Action must be approve or reject." }, { status: 400 });
  }

  const leave = db.prepare("SELECT id, status FROM leave_applications WHERE id = ?").get(leaveId) as LeaveApp | undefined;
  if (!leave) return NextResponse.json({ error: "Leave application not found." }, { status: 404 });

  const now = new Date().toISOString();

  if (admin.role === "admin") {
    if (leave.status !== "pending") {
      return NextResponse.json({ error: "This leave is not pending admin review." }, { status: 400 });
    }
    const newStatus = action === "approve" ? "admin_approved" : "admin_rejected";
    db.prepare(`
      UPDATE leave_applications
      SET status = ?, admin_id = ?, admin_note = ?, admin_action_at = ?
      WHERE id = ?
    `).run(newStatus, admin.id, note ?? null, now, leaveId);

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (admin.role === "super_admin") {
    if (leave.status !== "admin_approved") {
      return NextResponse.json({ error: "This leave has not been approved by admin yet." }, { status: 400 });
    }
    const newStatus = action === "approve" ? "approved" : "super_admin_rejected";
    db.prepare(`
      UPDATE leave_applications
      SET status = ?, super_admin_id = ?, super_admin_note = ?, super_admin_action_at = ?
      WHERE id = ?
    `).run(newStatus, admin.id, note ?? null, now, leaveId);

    return NextResponse.json({ success: true, status: newStatus });
  }

  return NextResponse.json({ error: "Unauthorized role." }, { status: 403 });
}
