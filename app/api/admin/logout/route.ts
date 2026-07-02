import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const response = NextResponse.redirect(`${proto}://${host}/admin/login`, 303);
  response.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
