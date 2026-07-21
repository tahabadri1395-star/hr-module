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
    UPDATE hr_travel_requests SET status=$1, admin_note=$2, approved_by=$3, approved_at=NOW()
    WHERE id=$4 RETURNING *
  `, [status, admin_note || null, admin.username, parseInt(id)]);

  const travel = result.rows[0];
  if (!travel) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Every date covered by an approved travel/site-visit request is auto-marked present,
  // so field staff aren't blocked by attendance geofencing on days they're legitimately elsewhere.
  const dates: string[] = [];
  const start = new Date(travel.travel_date + "T00:00:00");
  const end = new Date((travel.return_date || travel.travel_date) + "T00:00:00");
  for (let d = new Date(start); d <= end && dates.length < 90; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  if (status === "approved") {
    for (const date of dates) {
      await query(`
        INSERT INTO hr_attendance (employee_id, date, status, marked_by, notes)
        VALUES ($1,$2,'present','site_visit',$3)
        ON CONFLICT (employee_id, date) DO UPDATE SET
          status='present', marked_by='site_visit', notes=$3
          WHERE hr_attendance.marked_by <> 'self'
      `, [travel.employee_id, date, `Auto-marked: approved ${travel.travel_type.replace("_", " ")} — ${travel.destination}`]);
    }
  } else {
    for (const date of dates) {
      await query(`DELETE FROM hr_attendance WHERE employee_id=$1 AND date=$2 AND marked_by='site_visit'`, [travel.employee_id, date]);
    }
  }

  return NextResponse.json({ success: true, travel });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const existing = await query(`SELECT * FROM hr_travel_requests WHERE id=$1`, [parseInt(id)]);
  const travel = existing.rows[0];
  if (!travel) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const dates: string[] = [];
  const start = new Date(travel.travel_date + "T00:00:00");
  const end = new Date((travel.return_date || travel.travel_date) + "T00:00:00");
  for (let d = new Date(start); d <= end && dates.length < 90; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  for (const date of dates) {
    await query(`DELETE FROM hr_attendance WHERE employee_id=$1 AND date=$2 AND marked_by='site_visit'`, [travel.employee_id, date]);
  }

  await query(`DELETE FROM hr_travel_requests WHERE id=$1`, [parseInt(id)]);
  return NextResponse.json({ success: true });
}
