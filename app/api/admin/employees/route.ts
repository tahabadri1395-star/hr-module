import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

interface KhidmatGuzar {
  id: number;
  name: string;
  email: string;
  department: string | null;
  employee_code: string | null;
  active: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = db.prepare(`
    SELECT id, name, email, department, employee_code, active, created_at
    FROM employees ORDER BY name ASC
  `).all() as KhidmatGuzar[];

  return NextResponse.json({ list });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { name, email, department, employee_code, password } = await request.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM employees WHERE email = ?").get(email.trim());
  if (existing) return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  if (employee_code?.trim()) {
    const codeExists = db.prepare("SELECT id FROM employees WHERE employee_code = ?").get(employee_code.trim());
    if (codeExists) return NextResponse.json({ error: "Employee code already in use." }, { status: 409 });
  }

  const hash = bcrypt.hashSync(password.trim(), 10);
  const result = db.prepare(`
    INSERT INTO employees (name, email, department, employee_code, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), email.trim().toLowerCase(), department?.trim() || null, employee_code?.trim() || null, hash) as { lastInsertRowid: number };

  const created = db.prepare("SELECT id, name, email, department, employee_code, active, created_at FROM employees WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ success: true, employee: created }, { status: 201 });
}
