import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await query(`
    SELECT c.*,
      COUNT(cp.id) FILTER (WHERE cp.status = 'completed') as completed_count,
      COUNT(cp.id) FILTER (WHERE cp.status = 'in_progress') as in_progress_count,
      COUNT(cp.id) as enrolled_count,
      (SELECT COUNT(*) FROM hr_employees WHERE active=1) as total_kgs
    FROM hr_courses c
    LEFT JOIN hr_course_progress cp ON cp.course_id = c.id
    GROUP BY c.id
    ORDER BY c.status, c.category, c.created_at DESC
  `);

  return NextResponse.json({ courses: result.rows });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, description, category, content_url, instructor, duration_hours, department } = await request.json();
  if (!title?.trim() || !category) return NextResponse.json({ error: "Title and category required." }, { status: 400 });

  const result = await query(`
    INSERT INTO hr_courses (title, description, category, content_url, instructor, duration_hours, department, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [title.trim(), description?.trim() || null, category, content_url?.trim() || null,
      instructor?.trim() || null, duration_hours || null, department || null, admin.username]);

  return NextResponse.json({ success: true, course: result.rows[0] }, { status: 201 });
}
