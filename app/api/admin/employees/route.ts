import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT id, name, email, department, employee_code, active, created_at
    FROM hr_employees ORDER BY name ASC
  `);

  return NextResponse.json({ list: result.rows });
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

  const existing = await query("SELECT id FROM hr_employees WHERE email = $1", [email.trim()]);
  if (existing.rows[0]) return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  if (employee_code?.trim()) {
    const codeExists = await query("SELECT id FROM hr_employees WHERE employee_code = $1", [employee_code.trim()]);
    if (codeExists.rows[0]) return NextResponse.json({ error: "Employee code already in use." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password.trim(), 10);
  const result = await query(`
    INSERT INTO hr_employees (name, email, department, employee_code, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, department, employee_code, active, created_at
  `, [name.trim(), email.trim().toLowerCase(), department?.trim() || null, employee_code?.trim() || null, hash]);

  return NextResponse.json({ success: true, employee: result.rows[0] }, { status: 201 });
}
