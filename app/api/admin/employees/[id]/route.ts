import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const existing = db.prepare("SELECT id FROM employees WHERE id = ?").get(empId);
  if (!existing) return NextResponse.json({ error: "Khidmat Guzar not found." }, { status: 404 });

  const { name, email, department, employee_code, active, new_password } = await request.json();

  if (email) {
    const conflict = db.prepare("SELECT id FROM employees WHERE email = ? AND id != ?").get(email.trim(), empId);
    if (conflict) return NextResponse.json({ error: "Email already in use by another Khidmat Guzar." }, { status: 409 });
  }

  if (employee_code) {
    const conflict = db.prepare("SELECT id FROM employees WHERE employee_code = ? AND id != ?").get(employee_code.trim(), empId);
    if (conflict) return NextResponse.json({ error: "Employee code already in use." }, { status: 409 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (name !== undefined)          { updates.push("name = ?");            values.push(name.trim()); }
  if (email !== undefined)         { updates.push("email = ?");           values.push(email.trim().toLowerCase()); }
  if (department !== undefined)    { updates.push("department = ?");      values.push(department?.trim() || null); }
  if (employee_code !== undefined) { updates.push("employee_code = ?");   values.push(employee_code?.trim() || null); }
  if (active !== undefined)        { updates.push("active = ?");          values.push(active ? 1 : 0); }
  if (new_password?.trim())        { updates.push("password_hash = ?");   values.push(bcrypt.hashSync(new_password.trim(), 10)); }

  if (updates.length === 0) return NextResponse.json({ error: "No fields to update." }, { status: 400 });

  values.push(empId);
  db.prepare(`UPDATE employees SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.prepare("SELECT id, name, email, department, employee_code, active, created_at FROM employees WHERE id = ?").get(empId);
  return NextResponse.json({ success: true, employee: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const leaves = db.prepare("SELECT COUNT(*) as c FROM leave_applications WHERE employee_id = ?").get(empId) as { c: number };
  if (leaves.c > 0) {
    // Soft-delete: deactivate instead of hard delete to preserve leave history
    db.prepare("UPDATE employees SET active = 0 WHERE id = ?").run(empId);
    return NextResponse.json({ success: true, message: "Khidmat Guzar deactivated (has leave history)." });
  }

  db.prepare("DELETE FROM employees WHERE id = ?").run(empId);
  return NextResponse.json({ success: true, message: "Khidmat Guzar removed." });
}
