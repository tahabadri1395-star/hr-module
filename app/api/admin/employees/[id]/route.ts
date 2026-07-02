import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const existing = await query("SELECT id FROM hr_employees WHERE id = $1", [empId]);
  if (!existing.rows[0]) return NextResponse.json({ error: "Khidmat Guzar not found." }, { status: 404 });

  const { name, email, department, employee_code, active, new_password } = await request.json();

  if (email) {
    const conflict = await query("SELECT id FROM hr_employees WHERE email = $1 AND id != $2", [email.trim(), empId]);
    if (conflict.rows[0]) return NextResponse.json({ error: "Email already in use by another Khidmat Guzar." }, { status: 409 });
  }

  if (employee_code) {
    const conflict = await query("SELECT id FROM hr_employees WHERE employee_code = $1 AND id != $2", [employee_code.trim(), empId]);
    if (conflict.rows[0]) return NextResponse.json({ error: "Employee code already in use." }, { status: 409 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let p = 1;

  if (name !== undefined)          { updates.push(`name = $${p++}`);          values.push(name.trim()); }
  if (email !== undefined)         { updates.push(`email = $${p++}`);         values.push(email.trim().toLowerCase()); }
  if (department !== undefined)    { updates.push(`department = $${p++}`);    values.push(department?.trim() || null); }
  if (employee_code !== undefined) { updates.push(`employee_code = $${p++}`); values.push(employee_code?.trim() || null); }
  if (active !== undefined)        { updates.push(`active = $${p++}`);        values.push(active ? 1 : 0); }
  if (new_password?.trim())        { updates.push(`password_hash = $${p++}`); values.push(await bcrypt.hash(new_password.trim(), 10)); }

  if (updates.length === 0) return NextResponse.json({ error: "No fields to update." }, { status: 400 });

  values.push(empId);
  await query(
    `UPDATE hr_employees SET ${updates.join(", ")} WHERE id = $${p}`,
    values
  );

  const updated = await query(
    "SELECT id, name, email, department, employee_code, active, created_at FROM hr_employees WHERE id = $1",
    [empId]
  );
  return NextResponse.json({ success: true, employee: updated.rows[0] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const leaves = await query("SELECT COUNT(*) as c FROM hr_leave_applications WHERE employee_id = $1", [empId]);
  if (parseInt(leaves.rows[0].c, 10) > 0) {
    await query("UPDATE hr_employees SET active = 0 WHERE id = $1", [empId]);
    return NextResponse.json({ success: true, message: "Khidmat Guzar deactivated (has leave history)." });
  }

  await query("DELETE FROM hr_employees WHERE id = $1", [empId]);
  return NextResponse.json({ success: true, message: "Khidmat Guzar removed." });
}
