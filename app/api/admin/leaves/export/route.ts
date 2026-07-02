import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

function csv(val: unknown): string {
  if (val == null) return "";
  return `"${String(val).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return new NextResponse("Unauthorized", { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const result = await query(`
    SELECT
      la.id, e.name AS employee_name, e.email, e.department, e.employee_code,
      la.leave_type, la.start_date, la.end_date, la.is_half_day, la.half_day_period,
      la.reason, la.status, la.admin_note, la.super_admin_note,
      la.created_at
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    ORDER BY la.created_at DESC
  `);

  const headers = ["ID","Name","Email","Department","Code","Type","Start","End","Half Day","Period","Reason","Status","Admin Note","HR Note","Applied At"];
  const rows = result.rows.map(r => [
    r.id,
    csv(r.employee_name),
    csv(r.email),
    csv(r.department),
    csv(r.employee_code),
    r.leave_type,
    r.start_date,
    r.end_date,
    r.is_half_day ? "Yes" : "No",
    r.half_day_period ?? "",
    csv(r.reason),
    r.status,
    csv(r.admin_note),
    csv(r.super_admin_note),
    r.created_at,
  ].join(","));

  const csvBody = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leave-records-${date}.csv"`,
    },
  });
}
