import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "hr-module-employee-secret-key-change-in-prod"
);

export const EMPLOYEE_COOKIE = "hr_employee_token";

export async function signEmployeeToken(payload: { id: number; name: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifyEmployeeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; name: string; email: string };
  } catch {
    return null;
  }
}

export async function getEmployeeFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;
  return verifyEmployeeToken(token);
}

export function getEmployeeTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${EMPLOYEE_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
