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
    await client.query(`ALTER TABLE hr_employee_profiles ADD COLUMN IF NOT EXISTS personal_email TEXT`);

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
      CREATE TABLE IF NOT EXISTS hr_attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        date TEXT NOT NULL,
        clock_in TEXT,
        clock_out TEXT,
        status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','half_day')),
        notes TEXT,
        marked_by TEXT DEFAULT 'self',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK(category IN ('technical','soft_skills','compliance','leadership','safety','other')),
        content_url TEXT,
        instructor TEXT,
        duration_hours NUMERIC(5,1),
        department TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','archived')),
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_course_progress (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES hr_courses(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','completed')),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        score INTEGER,
        UNIQUE(course_id, employee_id)
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

    // Polls module retired — drop tables (children before parent) on any deployment that still has them
    await client.query(`DROP TABLE IF EXISTS hr_poll_votes`);
    await client.query(`DROP TABLE IF EXISTS hr_poll_options`);
    await client.query(`DROP TABLE IF EXISTS hr_polls`);

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS hr_expenses (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK(category IN ('travel','food','accommodation','office_supplies','communication','other')),
        amount NUMERIC(10,2) NOT NULL,
        receipt_url TEXT,
        expense_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        admin_note TEXT,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Travel & Expenses merge: expense claims can optionally link back to a travel request,
    // replacing the old standalone hr_reimbursements table.
    await client.query(`ALTER TABLE hr_expenses ADD COLUMN IF NOT EXISTS travel_id INTEGER REFERENCES hr_travel_requests(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE hr_expenses ADD COLUMN IF NOT EXISTS legacy_reimbursement_id INTEGER UNIQUE`);

    // One-time backfill of pre-merge reimbursement claims into hr_expenses (idempotent via the unique legacy id)
    await client.query(`
      INSERT INTO hr_expenses (employee_id, title, category, amount, expense_date, travel_id, status, admin_note, approved_by, approved_at, created_at, legacy_reimbursement_id)
      SELECT
        r.employee_id,
        r.description,
        CASE r.category WHEN 'transport' THEN 'travel' WHEN 'meals' THEN 'food' WHEN 'accommodation' THEN 'accommodation' ELSE 'other' END,
        r.amount,
        r.receipt_date,
        r.travel_id,
        r.status,
        r.admin_note,
        r.approved_by,
        r.approved_at,
        r.created_at,
        r.id
      FROM hr_reimbursements r
      ON CONFLICT (legacy_reimbursement_id) DO NOTHING
    `);

    // Seed admin accounts (no-op if already exist)
    // Abbas Qamari's admin login uses his ITS number as the username instead of a name-based one.
    // Migrate any pre-existing "AbbasQamari" account in place so his password/history carry over.
    await client.query(`UPDATE hr_admins SET username=$1 WHERE username=$2`, ["30303943", "AbbasQamari"]);
    const aqHash = await bcrypt.hash("AQ@Secure99", 10);
    await client.query(
      `INSERT INTO hr_admins (username, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ["30303943", aqHash, "admin"]
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
