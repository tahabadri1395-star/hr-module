import { redirect } from "next/navigation";
import { getEmployeeFromCookies } from "@/lib/auth";

export default async function HomePage() {
  const employee = await getEmployeeFromCookies();
  if (employee) redirect("/dashboard");
  redirect("/login");
}
