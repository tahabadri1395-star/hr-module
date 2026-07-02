import { Pool, types } from "pg";
import bcrypt from "bcryptjs";

// Return timestamps as strings (not Date objects) so existing string-based formatDate helpers work
types.setTypeParser(1114, (v: string) => v);
types.setTypeParser(1184, (v: string) => v);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 5,
});

let initPromise: Promise<void> | null = null;

async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
          CHECK(role IN ('admin', 'super_admin')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT,
        employee_code TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        active SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_leave_applications (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        leave_type TEXT NOT NULL CHECK(leave_type IN ('emergency', 'normal')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
          CHECK(status IN ('pending','admin_approved','approved','admin_rejected','super_admin_rejected')),
        admin_id INTEGER REFERENCES hr_admins(id),
        admin_note TEXT,
        admin_action_at TIMESTAMPTZ,
        super_admin_id INTEGER REFERENCES hr_admins(id),
        super_admin_note TEXT,
        super_admin_action_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed admin accounts (no-op if already exist)
    const aqHash = await bcrypt.hash("AQ@Secure99", 10);
    await client.query(
      `INSERT INTO hr_admins (username, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ["AbbasQamari", aqHash, "admin"]
    );

    const abHash = await bcrypt.hash("AB@Secure99", 10);
    await client.query(
      `INSERT INTO hr_admins (username, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ["AliasgerBs", abHash, "super_admin"]
    );
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: unknown[]) {
  if (!initPromise) initPromise = initDb();
  await initPromise;
  return pool.query(text, params);
}

export default { query };
