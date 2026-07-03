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
        is_half_day SMALLINT DEFAULT 0,
        half_day_period TEXT,
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

    // Add half-day columns to existing deployments (no-op on fresh)
    await client.query(`ALTER TABLE hr_leave_applications ADD COLUMN IF NOT EXISTS is_half_day SMALLINT DEFAULT 0`);
    await client.query(`ALTER TABLE hr_leave_applications ADD COLUMN IF NOT EXISTS half_day_period TEXT`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_public_holidays (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_employee_profiles (
        employee_id INTEGER PRIMARY KEY REFERENCES hr_employees(id),
        phone TEXT,
        whatsapp TEXT,
        address TEXT,
        city TEXT,
        date_of_birth TEXT,
        waris_name TEXT,
        waris_contact TEXT,
        waris_relation TEXT,
        its_number TEXT,
        passport_number TEXT,
        passport_expiry TEXT,
        aadhar_number TEXT,
        pan_number TEXT,
        bank_name TEXT,
        bank_account TEXT,
        bank_ifsc TEXT,
        bank_branch TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_employee_education (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        institution TEXT NOT NULL,
        degree TEXT,
        field TEXT,
        year_from TEXT,
        year_to TEXT,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_test_results (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        test_name TEXT NOT NULL,
        score TEXT,
        date TEXT,
        remarks TEXT,
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
