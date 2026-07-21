import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";
import { checkGeofence } from "@/lib/geo";

const LATE_HOUR = 9;
const LATE_MIN  = 30;

function computeStatus(clockIn: string): "present" | "late" {
  const [h, m] = clockIn.split(":").map(Number);
  return h > LATE_HOUR || (h === LATE_HOUR && m > LATE_MIN) ? "late" : "present";
}

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

  const [todayRes, monthRes] = await Promise.all([
    query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date=$2`,
      [employee.id, new Date().toISOString().slice(0, 10)]),
    query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date LIKE $2 ORDER BY date ASC`,
      [employee.id, `${month}%`]),
  ]);

  return NextResponse.json({ today: todayRes.rows[0] || null, records: monthRes.rows });
}

export async function POST(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { action, lat, lng } = await request.json(); // "clock_in" | "clock_out"
  const today = new Date().toISOString().slice(0, 10);
  const timeNow = new Date().toTimeString().slice(0, 5); // HH:MM

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Location is required to clock in/out. Please enable location access and try again." }, { status: 400 });
  }

  const onApprovedTravel = await query(
    `SELECT 1 FROM hr_travel_requests
     WHERE employee_id=$1 AND status='approved' AND $2 BETWEEN travel_date AND COALESCE(return_date, travel_date)`,
    [employee.id, today]
  );
  const geofenceBypassed = onApprovedTravel.rows.length > 0;

  let locationName: string | null = null;
  if (!geofenceBypassed) {
    const geofence = await checkGeofence(lat, lng);
    if (!geofence.ok) {
      const distText = geofence.nearestDistance != null ? `${geofence.nearestDistance}m` : "an unknown distance";
      const nameText = geofence.nearestName ? ` from ${geofence.nearestName}` : "";
      return NextResponse.json({ error: `You must be at a registered work location to clock in/out. You're ${distText}${nameText}.` }, { status: 403 });
    }
    locationName = geofence.locationName;
  }

  const existing = await query(`SELECT * FROM hr_attendance WHERE employee_id=$1 AND date=$2`, [employee.id, today]);

  if (action === "clock_in") {
    if (existing.rows.length && existing.rows[0].marked_by === "self") {
      return NextResponse.json({ error: "Already clocked in today." }, { status: 400 });
    }
    const status = computeStatus(timeNow);
    await query(
      `INSERT INTO hr_attendance (employee_id, date, clock_in, status, clock_in_lat, clock_in_lng, clock_in_location_name, marked_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'self')
       ON CONFLICT (employee_id, date) DO UPDATE SET
         clock_in=$3, status=$4, clock_in_lat=$5, clock_in_lng=$6, clock_in_location_name=$7, marked_by='self'`,
      [employee.id, today, timeNow, status, lat, lng, locationName]
    );
    return NextResponse.json({ success: true, status, clock_in: timeNow });
  }

  if (action === "clock_out") {
    if (!existing.rows.length) return NextResponse.json({ error: "Not clocked in yet." }, { status: 400 });
    if (existing.rows[0].clock_out) return NextResponse.json({ error: "Already clocked out." }, { status: 400 });
    await query(
      `UPDATE hr_attendance SET clock_out=$1, clock_out_lat=$2, clock_out_lng=$3, clock_out_location_name=$4 WHERE employee_id=$5 AND date=$6`,
      [timeNow, lat, lng, locationName, employee.id, today]
    );
    return NextResponse.json({ success: true, clock_out: timeNow });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
