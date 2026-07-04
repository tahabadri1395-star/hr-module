import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminTokenFromRequest, verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pollsRes = await query(`
    SELECT p.*,
      (SELECT COUNT(*) FROM hr_poll_votes WHERE poll_id=p.id) as total_votes,
      (SELECT COUNT(*) FROM hr_employees WHERE active=1) as total_kgs
    FROM hr_polls p ORDER BY p.created_at DESC
  `);

  const polls = [];
  for (const poll of pollsRes.rows) {
    const optsRes = await query(`
      SELECT o.id, o.option_text, o.display_order, COUNT(v.id)::int as vote_count
      FROM hr_poll_options o
      LEFT JOIN hr_poll_votes v ON v.option_id = o.id
      WHERE o.poll_id = $1
      GROUP BY o.id ORDER BY o.display_order
    `, [poll.id]);
    polls.push({ ...poll, options: optsRes.rows });
  }

  return NextResponse.json({ polls });
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = await verifyAdminToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, description, options, closes_at } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const opts = (options as string[]).filter(o => o?.trim());
  if (opts.length < 2) return NextResponse.json({ error: "At least 2 options required." }, { status: 400 });

  const pollRes = await query(
    `INSERT INTO hr_polls (title, description, created_by, closes_at) VALUES ($1,$2,$3,$4) RETURNING *`,
    [title.trim(), description?.trim() || null, admin.username, closes_at || null]
  );
  const poll = pollRes.rows[0];

  for (let i = 0; i < opts.length; i++) {
    await query(
      `INSERT INTO hr_poll_options (poll_id, option_text, display_order) VALUES ($1,$2,$3)`,
      [poll.id, opts[i].trim(), i]
    );
  }

  return NextResponse.json({ success: true, poll }, { status: 201 });
}
