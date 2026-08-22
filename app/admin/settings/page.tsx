import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import KhidmatGuzarManager from "@/components/KhidmatGuzarManager";
import HolidayManager from "@/components/HolidayManager";
import WorkLocationsManager from "@/components/WorkLocationsManager";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, glassPill } from "@/lib/desktop-theme";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const tab = sp.tab === "holidays" ? "holidays" : sp.tab === "work-locations" ? "work-locations" : "khidmat-guzars";

  const backUrl = admin.role === "super_admin" ? "/admin/super" : "/admin";

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
          <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>Settings</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href={backUrl} className="text-xs" style={{ color: muted }}>← Dashboard</Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: mutedFaint }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: ink }}>Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={glassPill}>
          {[
            { key: "khidmat-guzars", label: "Khidmat Guzars" },
            { key: "holidays",        label: "Public Holidays" },
            { key: "work-locations",  label: "Work Locations" },
          ].map(t => (
            <Link key={t.key} href={`/admin/settings?tab=${t.key}`}
              className="text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: tab === t.key ? "rgba(255,255,255,0.12)" : "transparent",
                color: tab === t.key ? ink : muted,
              }}>
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "khidmat-guzars" ? (
          <KhidmatGuzarManager />
        ) : tab === "work-locations" ? (
          <WorkLocationsManager />
        ) : (
          <HolidayManager />
        )}
      </div>
    </div>
  );
}
