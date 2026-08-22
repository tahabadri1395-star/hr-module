import { redirect } from "next/navigation";
import { getEmployeeFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";
import BottomNav from "@/components/mobile/BottomNav";
import PageTransition from "@/components/mobile/PageTransition";
import PushRegistration from "@/components/mobile/PushRegistration";
import MobileHeader from "@/components/mobile/MobileHeader";
import { bg } from "@/lib/mobile-theme";

export default async function MobileAppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/m/login");

  const picRes = await query(`SELECT profile_picture_url FROM hr_employee_profiles WHERE employee_id = $1`, [employee.id]);
  const pictureUrl: string | null = picRes.rows[0]?.profile_picture_url ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <PushRegistration />
      <MobileHeader name={employee.name} pictureUrl={pictureUrl} />
      <main className="px-4 pt-3" style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
