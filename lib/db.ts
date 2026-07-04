import { Pool, types } from "pg";
import bcrypt from "bcryptjs";

// Return timestamps as strings (not Date objects) so existing string-based formatDate helpers work
types.setTypeParser(1114, (v: string) => v);
types.setTypeParser(1184, (v: string) => v);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to INTEGER NOT NULL REFERENCES hr_employees(id),
        assigned_by TEXT NOT NULL,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','ongoing','completed')),
        due_date TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_travel_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        travel_type TEXT NOT NULL CHECK(travel_type IN ('site_visit','outstation','local')),
        destination TEXT NOT NULL,
        purpose TEXT NOT NULL,
        travel_date TEXT NOT NULL,
        return_date TEXT,
        estimated_cost NUMERIC(10,2),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        admin_note TEXT,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_reimbursements (
        id SERIAL PRIMARY KEY,
        travel_id INTEGER REFERENCES hr_travel_requests(id) ON DELETE SET NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        receipt_date TEXT NOT NULL,
        category TEXT DEFAULT 'other' CHECK(category IN ('transport','accommodation','meals','other')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        admin_note TEXT,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_murasalat (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        department TEXT,
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('urgent','normal','info')),
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_murasalat_reads (
        id SERIAL PRIMARY KEY,
        murasalat_id INTEGER NOT NULL REFERENCES hr_murasalat(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        read_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(murasalat_id, employee_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK(category IN ('policy','form','certificate','circular','sop','other')),
        file_url TEXT NOT NULL,
        department TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_assets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        asset_type TEXT NOT NULL CHECK(asset_type IN ('laptop','software','paid_app','hardware','other')),
        serial_number TEXT,
        license_key TEXT,
        description TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available','assigned','maintenance','retired')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_asset_assignments (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES hr_assets(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        assigned_by TEXT NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        returned_at TIMESTAMPTZ,
        notes TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','returned'))
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_polls (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','closed')),
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        closes_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_poll_options (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER NOT NULL REFERENCES hr_polls(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        display_order INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_poll_votes (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER NOT NULL REFERENCES hr_polls(id) ON DELETE CASCADE,
        option_id INTEGER NOT NULL REFERENCES hr_poll_options(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        voted_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(poll_id, employee_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_arz (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        category TEXT NOT NULL CHECK(category IN ('personal','professional','grievance','request')),
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('urgent','normal','info')),
        status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
        admin_response TEXT,
        responded_by TEXT,
        responded_at TIMESTAMPTZ,
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
