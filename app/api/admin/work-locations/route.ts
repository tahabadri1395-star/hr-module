import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query("SELECT * FROM hr_work_locations ORDER BY name ASC");
  return NextResponse.json({ locations: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { name, latitude, longitude, radius_meters } = await request.json();
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radius = radius_meters ? parseInt(radius_meters) : 150;

  if (!name?.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Name, latitude, and longitude are required." }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Latitude/longitude out of range." }, { status: 400 });
  }

  const result = await query(
    "INSERT INTO hr_work_locations (name, latitude, longitude, radius_meters) VALUES ($1,$2,$3,$4) RETURNING *",
    [name.trim(), lat, lng, radius]
  );
  return NextResponse.json({ success: true, location: result.rows[0] }, { status: 201 });
}
