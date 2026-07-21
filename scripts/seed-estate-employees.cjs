#!/usr/bin/env node
/**
 * One-off seed script: creates login accounts + profiles for the Estate Dept
 * Khidmat Guzars listed in the July 2026 "Estate Dept HR information form no.1".
 * Idempotent — matches existing rows by email or employee_code (ITS number)
 * and updates them instead of duplicating, so it's safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/seed-estate-employees.cjs
 */
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: DATABASE_URL=postgres://... node scripts/seed-estate-employees.cjs");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const DEFAULT_PASSWORD = "Welcome@123";
const DEPARTMENT = "Estate";

// [name, ITS number, official email, personal email, mobile, address]
// Abbas Qamari (ITS 30303943) is deliberately excluded — he gets an admin
// login instead of an employee account (handled by the seed block in lib/db.ts,
// which sets his hr_admins username to "30303943").
const ROSTER = [
  ["Abduttayeb Taher Vaziri", "30488004", "Admin@hatimiretreats.com", "Abduttayeb@vaziri.in", "9979944526", "Jasmine apartments mazgaon"],
  ["Mulla Fakhruddin Sh Juzer Bhai Thekawala", "30803057", "fakhruddin.t@dehestate.com", "superfk786@gmail.com", "8169296964", "Saifee park mazgaon"],
  ["M Mustafa Juzer Merchant", "30410268", "mustafa.merchant@dehestate.com", "mustafa.jmer@gmail.com", "9833098940", "1A-1407, Al Ezz, Bhendi Bazaar, Mumbai 400003, Maharastra"],
  ["Taher Bin Qamber Jamali", "40421222", "Surat@hatimiretreats.com", "tamarun52@gmail.com", "8980164152", "Salabatpura, Machi Market, Opp Madina Masjid Husainy Corner 4th Floor"],
  ["Mulla Mohammed Mulla Kaizar Bhai Jamali", "60426963", "mohammed.jamali@dehestate.com", "mohammedjamali2006@gmail.com", "7028526963", "1917 Anjeerwadi Saifee Burhani Park Transit 1"],
  ["Mulla Ismail Shk Mustafa Motagharwala", "30384695", "ismail.motaghar@dehestate.com", "ism5522017@gmail.com", "8107216176", "Anjeer Wadi, D Wing 19th Floor 1907"],
  ["M Murtaza Aliakbar Bhai Popat", "30368486", "murtazaaliakbar133@gmail.com", "murtazapopat786@gmail.com", "7073097938", "Saifee Burhani Park Transit Park-1, Anjeerwadi, Mazgaon"],
  ["Murtaza Shk Alimohammed Zakir", "40432173", "Murtaza.zakir@hatimiretreats.com", "murtaz786110@gmail.com", "86555091353", "1907, D Wing, Saifee Burhani Park, Transit 1, Anjeerwadi Mazgaon"],
  ["M Mustafa M Hatim Bh Shakir", "30487320", "mustafa.shakir@dehestate.com", "mushakir53@gmail.com", "9265055364", "Al Ezz Tower, Bhendi Bazar, Mumbai, 400003"],
  ["Mohsin Huzaifa Kachiya", "40901612", "mohsin.kach@dehestate.com", "mohsinxyz69@gmail.com", "8320789069", "Saifee Burhani Park, Byculla"],
  ["Mohammed Aliasger Vaziri", "30337268", "Mohammed.vaziri@hatimiretreats.com", "Mohammedvaziri@gmail.com", "9029979463", "7th Agha Bldg, 3rd Floor, Flat no 302, Dharamshi Street, Bhendi Bazaar, Mumbai 400003"],
  ["Burhanuddin Nomani", "30350004", "burhanuddinhn52@gmail.com", "Burhanuddinhn110@gmail.com", "8484927653", "Badri Baug, Sultanabad, Dumas Road, Dumas"],
  ["Ammar Yusuf Bastawala", "30409867", "ammarbestate@gmail.com", "abastawala@gmail.com", "9699105253", "C-210 Vinayak Apt, Pandit Dindayala Nagar, Vasai West, Mumbai 401202"],
  ["Taha Muslim Indorewala", "30425218", "taharealestate53@gmail.com", "tahaindorewala4@gmail.com", "7600690627", "1917 Saifee Burhani Park Transit 1, Anjeerwadi, Mazgaon"],
  ["Taha Ibrahim Bhai Kothari", "50442573", "it.estate@hatimiretreats.com", "as.tahakothari@gmail.com", "9316421185", "1907, D Wing, Anjeerwadi, Mazgaon, Mumbai 400010"],
  ["Huzefa Mustafa Kachwala", "30310162", "huzefa.kachwala777@gmail.com", "huzefa.kachwala77@gmail.com", "9619155234", "140, Fatehbhai Building, Abdul Rehman Street, Mumbai - 400003"],
  ["Abdulqadir Mohammed Officewala", "30423441", "abdoffice.5210@gmail.com", "abdoffice.5210@gmail.com", "9328191308", "Near Tadkeshwar Mandir, Abrama Road, Jaya Apartment A"],
  ["Murtaza Idris Bhai Ujjainwala", "30315516", "murtaza.ujjain@dehestate.com", "murtazaujjainwala5357@gmail.com", "8200199443", "22, Arsiwala Bldg, Ismail U. Kopekar Lane, Dlima Street, 3rd Floor, Room No 7&8, Dockyard, Mazgaon, Mumbai 400010"],
  ["M.Hatim Shabbir Bhai Ghadiyali", "30703639", "Dumas@hatimiretreats.com", "hatimghadiyali52@gmail.com", "9662179540", "Burhani Baug, Dumas"],
  ["M Hussain M Huzaifa Bhai Ezzy", "40410964", "hezzy.estate@gmail.com", "hussainolianbo@gmail.com", "7358380966", "1907, D-Block, Saifee Burhani Park, Anjeerwadi, Mazgaon"],
  ["Abbas Saifuddin Rampurawala", "30390126", "abbas.rampura@hatimiretreats.com", "abbas.52sr@gmail.com", "7666265470", "507, A-2, Sarkar Residency, Dr. Mascarenhas Road, Anjirwadi, Mazgaon, Mumbai-400010"],
  ["M Aliasgar M Mufaddal Amjawala", "60446147", "aliasger.amjawala@dehestate.com", "amjawalaali@gmail.com", "9950780253", "2105, 21st Floor, D-Wing, Saifee Burhani Transit Park - 1, Thakur Estate, Champsi Bhimji Rd, off Mascarenhas Road, near Old Anjirwadi, Anjeer Wadi, Thakkar Estate, Mazgaon, Mumbai, Maharashtra 400010"],
  ["M Mufaddal M Murtaza Bhai Laila", "30306953", "mufaddal.laila@dehestate.com", "mufaddallaila72@gmail.com", "+91 9820800352", "Grandeur Heights, Room No. 2101, Next to Safar Tower, Ramchandra Bhatt Marg, Noor Baugh, Mumbai - 400009"],
  ["M.Burhanuddin Makkahwala", "40454642", "Burhanuddin.makkahwala@hatimiretreats.com", "Altab110@gmail.com", "8879401678", "Bismillah Residency, near JJ Signal, Nagpada, Mumbai 400008"],
  ["M Mohammed Shk Juzar Rajkotwala", "30305604", "mohammed.rajkotwala@dehestate.com", "mohammedrajkot53@gmail.com", "8879889753", "Room No: 3166, Floor: 31, Al-Ezz Tower, Wing 2B, Bhendi Bazaar, Mumbai, Maharashtra 400003"],
  ["M.Mustafa M.Huzefa Bhai Unjhawala", "60405343", "mustafa.unjhawala@hatimiretreats.com", "mustafaunjhawala52@gmail.com", "9384151208", "1907, 19th Floor, D Wing, Saifee Burhani Park Transit 1, Anjeerwadi, Thakkar Estate, Mazgaon, Mumbai 400010"],
  ["Taher Godhrawala", "30306932", "bmsiyanat@gmail.com", "tahergodhrawala786@gmail.com", "9029236351", "95 Janjikar Street, Royal Building, 3rd Floor, Room No 40, Mohammedali Road"],
  ["Kasim Hatim Dahodwala", "30391052", "Qasim.dohad@dehestate.com", "Qasimdahodwala@gmail.com", "7738821253", "Al Ezz, 1808, 1A, Bhendi Bazaar, Mumbai - 400003"],
  ["Ibrahim Amin", "30405353", "ibrahim.amin@oclp.in", "Ibrahim.amin5253@gmail.com", "8269405748", "Flat No 502, A Wing, 6th Floor, Khare Chambers, Gokulpeth Market, Above Malwa Trading, Gokulpeth, Nagpur-440010"],
  ["M. Hatim Burhanuddin Bhai Dhari", "30348528", "hatimdhari786@gmail.com", "hatimdhari786@gmail.com", "9111165274", "Dargah e Hakimi, Lodhipura, Burhanpur"],
  ["M Husain Shk Aziz Bhai Rashid", "30907595", "husazizrashid@gmail.com", "husazizrashid@gmail.com", "8976504153", "Dumas/Surat"],
  ["Taha Bin Hatim Bs Badri", "30903555", "taha.badri@dehestate.com", "tahabadri1896@gmail.com", "+91 7208323551", "Saifee Burhani Transit Park, Anjeerwadi, D Wing, 19th Floor, 1917"],
  ["Huzefa Hakimuddin Bhai Savai", "30307008", "hsavai.estate@gmail.com", "hhsavai@gmail.com", "9820288352", "Room No.6, 3rd Floor, Mariam Manzil, 126 Abdul Rehman Street, Mumbai - 400003"],
  ["Taher H Nomani", "20324056", "tahernomani@gmail.com", "tahernomani@gmail.com", "9819802217", "Saifee Villa, Matheran"],
  ["Huzefa Attarwala", "40465844", "huzefa.shakir@dehestate.com", "huzefa333@gmail.com", "9833107252", "2101, 2A, Naman Regency, Mazgaon, Mumbai 400010"],
  ["M.Hatim Haider Bhai Jathwala", "30482728", "hjath.estate@gmail.com", "hatimjath52@gmail.com", "7415615253", "Neeva Apartment, 2nd Floor, Kharwawad, Nanpura, Surat, 395001"],
];

async function main() {
  const client = await pool.connect();
  const results = [];
  try {
    for (const [name, its, officialEmail, personalEmail, mobile, address] of ROSTER) {
      const loginEmail = (officialEmail || personalEmail).trim().toLowerCase();

      const existing = await client.query(
        `SELECT id FROM hr_employees WHERE email=$1 OR employee_code=$2`,
        [loginEmail, its]
      );

      let employeeId;
      let action;
      if (existing.rows[0]) {
        employeeId = existing.rows[0].id;
        await client.query(
          `UPDATE hr_employees SET name=$1, department=$2, employee_code=$3 WHERE id=$4`,
          [name, DEPARTMENT, its, employeeId]
        );
        action = "updated";
      } else {
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const res = await client.query(
          `INSERT INTO hr_employees (name, email, department, employee_code, password_hash)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [name, loginEmail, DEPARTMENT, its, passwordHash]
        );
        employeeId = res.rows[0].id;
        action = "created";
      }

      await client.query(
        `INSERT INTO hr_employee_profiles (employee_id, phone, address, its_number, personal_email, updated_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (employee_id) DO UPDATE SET
           phone=$2, address=$3, its_number=$4, personal_email=$5, updated_at=NOW()`,
        [employeeId, mobile, address, its, personalEmail || null]
      );

      results.push({ action, employeeId, name, its, loginEmail });
      console.log(`${action === "created" ? "Created" : "Updated"} #${employeeId} — ${name} (ITS ${its}) — login: ${loginEmail}`);
    }

    const createdCount = results.filter(r => r.action === "created").length;
    const updatedCount = results.filter(r => r.action === "updated").length;
    console.log(`\nDone. ${createdCount} created, ${updatedCount} updated.`);
    console.log(`Temp password for every newly created account: ${DEFAULT_PASSWORD}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
