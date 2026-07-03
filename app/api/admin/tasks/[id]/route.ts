import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { title, description, assigned_to, priority, due_date, status } = await request.json();

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let p = 1;

  if (title !== undefined)       { setClauses.push(`title=$${p++}`);       values.push(title?.trim() || null); }
  if (description !== undefined) { setClauses.push(`description=$${p++}`); values.push(description?.trim() || null); }
  if (assigned_to !== undefined) { setClauses.push(`assigned_to=$${p++}`); values.push(parseInt(assigned_to)); }
  if (priority !== undefined)    { setClauses.push(`priority=$${p++}`);    values.push(priority); }
  if (due_date !== undefined)    { setClauses.push(`due_date=$${p++}`);    values.push(due_date || null); }
  if (status !== undefined) {
    setClauses.push(`status=$${p++}`);
    values.push(status);
    if (status === "completed") { setClauses.push(`completed_at=NOW()`); }
    else { setClauses.push(`completed_at=NULL`); }
  }

  setClauses.push(`updated_at=NOW()`);
  values.push(parseInt(id));

  const result = await query(
    `UPDATE hr_tasks SET ${setClauses.join(", ")} WHERE id=$${p} RETURNING *`,
    values
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ success: true, task: result.rows[0] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM hr_tasks WHERE id = $1", [parseInt(id)]);
  return NextResponse.json({ success: true });
}
