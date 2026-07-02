import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

interface Admin {
  id: number;
  username: string;
  password_hash: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required." }, { status: 400 });
    }

    const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as Admin | undefined;

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signAdminToken({ id: admin.id, username: admin.username, role: admin.role });

    const response = NextResponse.json({ success: true, role: admin.role, username: admin.username });
    response.cookies.set(ADMIN_COOKIE, token, {
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
