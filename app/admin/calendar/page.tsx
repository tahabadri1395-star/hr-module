import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface LeaveOnDay {
  id: number;
  employee_name: string;
  leave_type: string;
  is_half_day: boolean;
  status: string;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  emergency: { bg: "rgba(244,63,94,0.18)", color: "#FB7185" },
  normal:    { bg: "rgba(96,165,250,0.18)", color: "#93C5FD" },
};

function pad(n: number) { return String(n).padStart(2, "0"); }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-based

  if (sp.month) {
    const parts = sp.month.split("-");
    if (parts.length === 2) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
    }
  }

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay.getDate())}`;

  // Fetch all approved/admin_approved leaves that overlap this month
  const result = await query(`
    SELECT la.id, la.start_date, la.end_date, la.leave_type, la.is_half_day, la.status,
      e.name AS employee_name
    FROM hr_leave_applications la
    JOIN hr_employees e ON la.employee_id = e.id
    WHERE la.status IN ('approved', 'admin_approved', 'pending')
      AND la.start_date <= $2
      AND la.end_date >= $1
    ORDER BY la.start_date ASC
  `, [monthStart, monthEnd]);

  // Fetch public holidays for this month
  const holidayResult = await query(
    "SELECT date, name FROM hr_public_holidays WHERE date >= $1 AND date <= $2 ORDER BY date ASC",
    [monthStart, monthEnd]
  );
  const holidayMap: Record<string, string> = {};
  holidayResult.rows.forEach(h => { holidayMap[h.date] = h.name; });

  // Build day → leaves map
  const dayMap: Record<string, LeaveOnDay[]> = {};
  for (const leave of result.rows) {
    const s = new Date(leave.start_date + "T00:00:00");
    const e = new Date(leave.end_date + "T00:00:00");
    const cur = new Date(Math.max(s.getTime(), firstDay.getTime()));
    const end = new Date(Math.min(e.getTime(), lastDay.getTime()));
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push({ id: leave.id, employee_name: leave.employee_name, leave_type: leave.leave_type, is_half_day: !!leave.is_half_day, status: leave.status });
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Build calendar grid
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Prev / next month
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevParam = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`;
  const nextParam = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}`;

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <img src="/estate-mark-white.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>
            Leave Calendar
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin" className="text-xs" style={{ color: muted }}>Admin</Link>
          <Link href="/admin/settings" className="text-xs" style={{ color: muted }}>Settings</Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: mutedFaint }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 relative">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: ink }}>
            {MONTH_NAMES[month - 1]} {year}
          </h1>
          <div className="flex items-center gap-2">
            <Link href={`/admin/calendar?month=${prevParam}`}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
              ← Prev
            </Link>
            <Link href="/admin/calendar"
              className="px-4 py-2 rounded-lg border text-sm font-medium"
              style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
              Today
            </Link>
            <Link href={`/admin/calendar?month=${nextParam}`}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
              Next →
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span style={{ color: mutedFaint }}>Legend:</span>
          <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(96,165,250,0.18)", color: "#93C5FD" }}>Normal</span>
          <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(244,63,94,0.18)", color: "#FB7185" }}>Emergency</span>
          <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(217,180,108,0.18)", color: gold }}>Public Holiday</span>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl overflow-hidden" style={glassCard}>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {DAY_NAMES.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider"
                style={{ color: mutedFaint }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {Array.from({ length: cells.length / 7 }, (_, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                if (!day) return (
                  <div key={di} className="min-h-24 p-2 border-r last:border-r-0" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }} />
                );
                const dateKey = `${year}-${pad(month)}-${pad(day)}`;
                const dayLeaves = dayMap[dateKey] ?? [];
                const holiday = holidayMap[dateKey];
                const isToday = dateKey === todayStr;
                return (
                  <div key={di} className="min-h-24 p-2 border-r last:border-r-0 relative"
                    style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: isToday ? "rgba(217,180,108,0.08)" : "transparent" }}>
                    <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full mb-1`}
                      style={{
                        backgroundColor: isToday ? gold : "transparent",
                        color: isToday ? "#1B1630" : ink,
                      }}>
                      {day}
                    </span>
                    {holiday && (
                      <div className="text-xs px-1.5 py-0.5 rounded mb-1 truncate font-medium"
                        style={{ backgroundColor: "rgba(217,180,108,0.18)", color: gold }}>
                        {holiday}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {dayLeaves.slice(0, 3).map(l => {
                        const c = TYPE_COLOR[l.leave_type] ?? TYPE_COLOR.normal;
                        return (
                          <Link key={l.id} href={`/leave/${l.id}`}
                            className="block text-xs px-1.5 py-0.5 rounded truncate"
                            style={{ backgroundColor: c.bg, color: c.color }}>
                            {l.employee_name.split(" ")[0]}{l.is_half_day ? " ½" : ""}
                          </Link>
                        );
                      })}
                      {dayLeaves.length > 3 && (
                        <p className="text-xs" style={{ color: mutedFaint }}>+{dayLeaves.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
