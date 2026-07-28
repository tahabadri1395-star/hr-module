import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getISTDateTime } from "@/lib/time";
import { notifyEmployee } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { date: today } = getISTDateTime();

  const result = await query(
    `SELECT id FROM hr_employees e
     WHERE active = 1
       AND NOT EXISTS (
         SELECT 1 FROM hr_attendance a
         WHERE a.employee_id = e.id AND a.date = $1
           AND (a.clock_in IS NOT NULL OR a.marked_by = 'site_visit')
       )`,
    [today]
  );

  for (const row of result.rows) {
    await notifyEmployee(row.id, {
      type: "attendance",
      title: "Don't forget to clock in",
      body: "You haven't clocked in yet today.",
      link: "/m/attendance",
    });
  }

  return NextResponse.json({ success: true, notified: result.rows.length });
}
