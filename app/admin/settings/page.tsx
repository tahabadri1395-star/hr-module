import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminFromCookies } from "@/lib/admin-auth";
import KhidmatGuzarManager from "@/components/KhidmatGuzarManager";
import HolidayManager from "@/components/HolidayManager";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const tab = sp.tab === "holidays" ? "holidays" : "khidmat-guzars";

  const backUrl = admin.role === "super_admin" ? "/admin/super" : "/admin";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>Settings</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href={backUrl} className="text-xs" style={{ color: "#64748B" }}>← Dashboard</Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs" style={{ color: "#94A3B8" }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: "#1E293B" }}>Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "#F1F5F9" }}>
          {[
            { key: "khidmat-guzars", label: "Khidmat Guzars" },
            { key: "holidays",        label: "Public Holidays" },
          ].map(t => (
            <Link key={t.key} href={`/admin/settings?tab=${t.key}`}
              className="text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: tab === t.key ? "white" : "transparent",
                color: tab === t.key ? "#1E293B" : "#64748B",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "khidmat-guzars" ? (
          <KhidmatGuzarManager adminRole={admin.role} />
        ) : (
          <HolidayManager />
        )}
      </div>
    </div>
  );
}
