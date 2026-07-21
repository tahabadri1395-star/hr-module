#!/usr/bin/env node
/**
 * One-off seed script: creates login accounts + profiles for the Estate Dept
 * Khidmat Guzars, via the deployed app's own admin HTTP API (no direct DB
 * connection needed). Idempotent — looks up existing employees by email or
 * employee_code (ITS number) and just updates the profile if already present.
 *
 * Usage:
 *   BASE_URL=https://hr-module-gpqf.onrender.com \
 *   ADMIN_USERNAME=30303943 ADMIN_PASSWORD='AQ@Secure99' \
 *   node scripts/seed-estate-employees-via-api.cjs
 */

const BASE_URL = process.env.BASE_URL || "https://hr-module-gpqf.onrender.com";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "30303943";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DEFAULT_PASSWORD = "Welcome@123";
const DEPARTMENT = "Estate";

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD env var is required.");
  process.exit(1);
}

// [name, ITS number, official email, personal email, mobile, address]
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

function extractCookie(setCookieHeader) {
  const match = /hr_admin_token=[^;]+/.exec(setCookieHeader || "");
  if (!match) throw new Error("Login did not return hr_admin_token cookie: " + setCookieHeader);
  return match[0];
}

async function main() {
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  const cookie = extractCookie(loginRes.headers.get("set-cookie"));
  console.log("Logged in as admin.");

  const listRes = await fetch(`${BASE_URL}/api/admin/employees`, { headers: { Cookie: cookie } });
  if (!listRes.ok) throw new Error(`Failed to list employees: ${listRes.status}`);
  const { list } = await listRes.json();
  const byEmail = new Map(list.map(e => [e.email.toLowerCase(), e]));
  const byCode = new Map(list.filter(e => e.employee_code).map(e => [e.employee_code, e]));

  let created = 0, alreadyExisted = 0, failed = 0;

  for (const [name, its, officialEmail, personalEmail, mobile, address] of ROSTER) {
    const loginEmail = (officialEmail || personalEmail).trim().toLowerCase();
    let employee = byEmail.get(loginEmail) || byCode.get(its);

    if (!employee) {
      const res = await fetch(`${BASE_URL}/api/admin/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name, email: loginEmail, department: DEPARTMENT, employee_code: its, password: DEFAULT_PASSWORD }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`FAILED to create ${name} (${its}): ${res.status} ${data.error}`);
        failed++;
        continue;
      }
      employee = data.employee;
      created++;
      console.log(`Created #${employee.id} — ${name} (ITS ${its}) — login: ${loginEmail}`);
    } else {
      alreadyExisted++;
      console.log(`Already exists #${employee.id} — ${name} (ITS ${its}) — login: ${employee.email}`);
    }

    const profRes = await fetch(`${BASE_URL}/api/admin/employees/${employee.id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ phone: mobile, address, its_number: its, personal_email: personalEmail || null }),
    });
    if (!profRes.ok) {
      console.error(`  -> FAILED to save profile for ${name}: ${profRes.status} ${await profRes.text()}`);
      failed++;
    }
  }

  console.log(`\nDone. ${created} created, ${alreadyExisted} already existed, ${failed} failed.`);
  console.log(`Temp password for newly created accounts: ${DEFAULT_PASSWORD}`);
}

main().catch(err => { console.error(err); process.exit(1); });
