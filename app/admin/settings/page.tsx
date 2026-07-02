import { redirect } from "next/navigation";
import { getAdminFromCookies } from "@/lib/admin-auth";
import KhidmatGuzarManager from "@/components/KhidmatGuzarManager";

export default async function SettingsPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");

  return <KhidmatGuzarManager adminRole={admin.role} />;
}
