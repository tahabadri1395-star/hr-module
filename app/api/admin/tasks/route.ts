import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assigned_to");

  let q = `
    SELECT t.*, e.name AS employee_name, e.department, e.employee_code
    FROM hr_tasks t
    JOIN hr_employees e ON e.id = t.assigned_to
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let p = 1;

  if (status) { q += ` AND t.status = $${p++}`; params.push(status); }
  if (assignedTo) { q += ` AND t.assigned_to = $${p++}`; params.push(parseInt(assignedTo)); }

  q += " ORDER BY t.created_at DESC";

  const result = await query(q, params);
  return NextResponse.json({ tasks: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, description, assigned_to, priority, due_date } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!assigned_to) return NextResponse.json({ error: "Assigned to is required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_tasks (title, description, assigned_to, assigned_by, priority, due_date)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `, [title.trim(), description?.trim() || null, parseInt(assigned_to), admin.username, priority || "medium", due_date || null]);

  return NextResponse.json({ success: true, task: result.rows[0] }, { status: 201 });
}
