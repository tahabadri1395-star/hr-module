import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
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

    const employee = db.prepare("SELECT * FROM employees WHERE email = ?").get(email) as Employee | undefined;

    if (!employee || !bcrypt.compareSync(password, employee.password_hash)) {
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
