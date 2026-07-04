import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const pollId = parseInt(id);
  const { option_id } = await request.json();
  if (!option_id) return NextResponse.json({ error: "Option required." }, { status: 400 });

  // Check poll is active
  const pollRes = await query(`SELECT status FROM hr_polls WHERE id=$1`, [pollId]);
  if (!pollRes.rows.length) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  if (pollRes.rows[0].status !== "active") return NextResponse.json({ error: "Poll is closed." }, { status: 400 });

  // Check already voted
  const existing = await query(`SELECT id FROM hr_poll_votes WHERE poll_id=$1 AND employee_id=$2`, [pollId, employee.id]);
  if (existing.rows.length) return NextResponse.json({ error: "Already voted." }, { status: 400 });

  await query(
    `INSERT INTO hr_poll_votes (poll_id, option_id, employee_id) VALUES ($1,$2,$3)`,
    [pollId, option_id, employee.id]
  );
  return NextResponse.json({ success: true });
}
