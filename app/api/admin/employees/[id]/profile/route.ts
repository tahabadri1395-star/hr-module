import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);

  const [empResult, profileResult, eduResult, testResult] = await Promise.all([
    query("SELECT id, name, email, department, employee_code, active, created_at FROM hr_employees WHERE id = $1", [empId]),
    query("SELECT * FROM hr_employee_profiles WHERE employee_id = $1", [empId]),
    query("SELECT * FROM hr_employee_education WHERE employee_id = $1 ORDER BY year_from DESC", [empId]),
    query("SELECT * FROM hr_test_results WHERE employee_id = $1 ORDER BY date DESC", [empId]),
  ]);

  if (!empResult.rows[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    employee: empResult.rows[0],
    profile: profileResult.rows[0] ?? null,
    education: eduResult.rows,
    test_results: testResult.rows,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id);
  const body = await request.json();

  const {
    phone, whatsapp, address, city, date_of_birth,
    waris_name, waris_contact, waris_relation,
    its_number, passport_number, passport_expiry,
    aadhar_number, pan_number,
    bank_name, bank_account, bank_ifsc, bank_branch,
    personal_email,
  } = body;

  await query(`
    INSERT INTO hr_employee_profiles (
      employee_id, phone, whatsapp, address, city, date_of_birth,
      waris_name, waris_contact, waris_relation,
      its_number, passport_number, passport_expiry,
      aadhar_number, pan_number,
      bank_name, bank_account, bank_ifsc, bank_branch, personal_email, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
    ON CONFLICT (employee_id) DO UPDATE SET
      phone=$2, whatsapp=$3, address=$4, city=$5, date_of_birth=$6,
      waris_name=$7, waris_contact=$8, waris_relation=$9,
      its_number=$10, passport_number=$11, passport_expiry=$12,
      aadhar_number=$13, pan_number=$14,
      bank_name=$15, bank_account=$16, bank_ifsc=$17, bank_branch=$18, personal_email=$19, updated_at=NOW()
  `, [
    empId,
    phone||null, whatsapp||null, address||null, city||null, date_of_birth||null,
    waris_name||null, waris_contact||null, waris_relation||null,
    its_number||null, passport_number||null, passport_expiry||null,
    aadhar_number||null, pan_number||null,
    bank_name||null, bank_account||null, bank_ifsc||null, bank_branch||null, personal_email||null,
  ]);

  return NextResponse.json({ success: true });
}
