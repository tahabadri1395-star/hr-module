import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [empResult, profileResult, eduResult, testResult] = await Promise.all([
    query("SELECT id, name, email, department, employee_code, created_at FROM hr_employees WHERE id = $1", [employee.id]),
    query("SELECT * FROM hr_employee_profiles WHERE employee_id = $1", [employee.id]),
    query("SELECT * FROM hr_employee_education WHERE employee_id = $1 ORDER BY year_from DESC", [employee.id]),
    query("SELECT * FROM hr_test_results WHERE employee_id = $1 ORDER BY date DESC", [employee.id]),
  ]);

  return NextResponse.json({
    employee: empResult.rows[0] ?? null,
    profile: profileResult.rows[0] ?? null,
    education: eduResult.rows,
    test_results: testResult.rows,
  });
}

export async function PUT(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const { phone, whatsapp, address, city, date_of_birth, waris_name, waris_contact, waris_relation } = body;

  await query(`
    INSERT INTO hr_employee_profiles (employee_id, phone, whatsapp, address, city, date_of_birth, waris_name, waris_contact, waris_relation, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (employee_id) DO UPDATE SET
      phone=$2, whatsapp=$3, address=$4, city=$5, date_of_birth=$6,
      waris_name=$7, waris_contact=$8, waris_relation=$9, updated_at=NOW()
  `, [employee.id, phone||null, whatsapp||null, address||null, city||null, date_of_birth||null, waris_name||null, waris_contact||null, waris_relation||null]);

  return NextResponse.json({ success: true });
}
