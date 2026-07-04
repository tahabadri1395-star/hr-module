import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEmployeeTokenFromRequest, verifyEmployeeToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getEmployeeTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const employee = await verifyEmployeeToken(token);
  if (!employee) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Get all polls with options, vote counts, and whether this employee voted
  const pollsRes = await query(`
    SELECT p.*,
      (SELECT COUNT(*) FROM hr_poll_votes WHERE poll_id=p.id) as total_votes,
      (SELECT option_id FROM hr_poll_votes WHERE poll_id=p.id AND employee_id=$1) as my_vote
    FROM hr_polls p
    ORDER BY p.status ASC, p.created_at DESC
  `, [employee.id]);

  const polls = [];
  for (const poll of pollsRes.rows) {
    const optsRes = await query(`
      SELECT o.id, o.option_text, o.display_order,
        COUNT(v.id)::int as vote_count
      FROM hr_poll_options o
      LEFT JOIN hr_poll_votes v ON v.option_id = o.id
      WHERE o.poll_id = $1
      GROUP BY o.id ORDER BY o.display_order
    `, [poll.id]);
    polls.push({ ...poll, options: optsRes.rows });
  }

  return NextResponse.json({ polls });
}
