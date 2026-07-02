import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "hr-module.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    employee_code TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL CHECK(leave_type IN ('emergency', 'normal')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','admin_approved','approved','admin_rejected','super_admin_rejected')),
    admin_id INTEGER,
    admin_note TEXT,
    admin_action_at TEXT,
    super_admin_id INTEGER,
    super_admin_note TEXT,
    super_admin_action_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (admin_id) REFERENCES admins(id),
    FOREIGN KEY (super_admin_id) REFERENCES admins(id)
  );
`);

// Wipe old placeholder admins and set real accounts
const placeholders = ["admin", "superadmin"];
placeholders.forEach(u => {
  const row = db.prepare("SELECT id FROM admins WHERE username = ?").get(u) as { id: number } | undefined;
  if (row) db.prepare("DELETE FROM admins WHERE id = ?").run(row.id);
});

// Abbas Qamari — Admin (first-level approver)
const aqHash = bcrypt.hashSync("AQ@Secure99", 10);
db.prepare("INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)").run("AbbasQamari", aqHash, "admin");

// Aliasger Bs — Super Admin (final approver)
const abHash = bcrypt.hashSync("AB@Secure99", 10);
db.prepare("INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?, ?, ?)").run("AliasgerBs", abHash, "super_admin");

export default db;
