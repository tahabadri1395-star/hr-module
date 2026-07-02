import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { signEmployeeToken, EMPLOYEE_COOKIE } from "@/lib/auth";

interface Employee {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  active: number;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const result = await query("SELECT * FROM hr_employees WHERE email = $1", [email]);
    const employee = result.rows[0] as Employee | undefined;

    if (!employee || !(await bcrypt.compare(password, employee.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (!employee.active) {
      return NextResponse.json({ error: "Your account has been deactivated." }, { status: 403 });
    }

    const token = await signEmployeeToken({ id: employee.id, name: employee.name, email: employee.email });

    const response = NextResponse.json({ success: true, name: employee.name });
    response.cookies.set(EMPLOYEE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
