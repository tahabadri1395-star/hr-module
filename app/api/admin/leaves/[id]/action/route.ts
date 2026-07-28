import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";
import { notifyEmployee } from "@/lib/notifications";

interface LeaveApp {
  id: number;
  status: string;
  employee_id: number;
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

  const leaveResult = await query("SELECT id, status, employee_id FROM hr_leave_applications WHERE id = $1", [leaveId]);
  const leave = leaveResult.rows[0] as LeaveApp | undefined;
  if (!leave) return NextResponse.json({ error: "Leave application not found." }, { status: 404 });

  const now = new Date().toISOString();

  if (admin.role === "admin") {
    if (leave.status !== "pending") {
      return NextResponse.json({ error: "This leave is not pending admin review." }, { status: 400 });
    }
    const newStatus = action === "approve" ? "admin_approved" : "admin_rejected";
    await query(`
      UPDATE hr_leave_applications
      SET status = $1, admin_id = $2, admin_note = $3, admin_action_at = $4
      WHERE id = $5
    `, [newStatus, admin.id, note ?? null, now, leaveId]);

    if (newStatus === "admin_rejected") {
      await notifyEmployee(leave.employee_id, {
        type: "leave",
        title: "Leave request rejected",
        body: "Your leave application was rejected.",
        link: `/leave/${leaveId}`,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (admin.role === "super_admin") {
    if (leave.status !== "admin_approved") {
      return NextResponse.json({ error: "This leave has not been approved by admin yet." }, { status: 400 });
    }
    const newStatus = action === "approve" ? "approved" : "super_admin_rejected";
    await query(`
      UPDATE hr_leave_applications
      SET status = $1, super_admin_id = $2, super_admin_note = $3, super_admin_action_at = $4
      WHERE id = $5
    `, [newStatus, admin.id, note ?? null, now, leaveId]);

    await notifyEmployee(leave.employee_id, {
      type: "leave",
      title: newStatus === "approved" ? "Leave request approved" : "Leave request rejected",
      body: newStatus === "approved" ? "Your leave application has been approved." : "Your leave application was rejected.",
      link: `/leave/${leaveId}`,
    });

    return NextResponse.json({ success: true, status: newStatus });
  }

  return NextResponse.json({ error: "Unauthorized role." }, { status: 403 });
}
