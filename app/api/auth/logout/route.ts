import { NextRequest, NextResponse } from "next/server";
import { EMPLOYEE_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(EMPLOYEE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
