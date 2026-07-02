import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const result = await query("SELECT id, date, name FROM hr_public_holidays ORDER BY date ASC");
  return NextResponse.json({ holidays: result.rows });
}
