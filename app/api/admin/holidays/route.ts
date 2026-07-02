import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query("SELECT * FROM hr_public_holidays ORDER BY date ASC");
  return NextResponse.json({ holidays: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { date, name } = await request.json();
  if (!date || !name?.trim()) {
    return NextResponse.json({ error: "Date and name are required." }, { status: 400 });
  }

  const result = await query(
    "INSERT INTO hr_public_holidays (date, name) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET name = $2 RETURNING *",
    [date, name.trim()]
  );
  return NextResponse.json({ success: true, holiday: result.rows[0] }, { status: 201 });
}
