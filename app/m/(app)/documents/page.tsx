import { getEmployeeFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const CATEGORY_LABEL: Record<string, string> = {
  policy: "Policy", form: "Form", certificate: "Certificate", circular: "Circular", sop: "SOP", other: "Other",
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function MobileDocumentsPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/m/login");

  const empRes = await query(`SELECT department FROM hr_employees WHERE id=$1`, [employee.id]);
  const dept = empRes.rows[0]?.department ?? null;

  const result = await query(
    `SELECT * FROM hr_documents WHERE department IS NULL OR department=$1 ORDER BY category, created_at DESC`,
    [dept ?? ""]
  );
  const docs = result.rows;

  return (
    <div className="space-y-2.5 pb-2">
      {docs.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No documents available.</div>
      ) : (
        docs.map(d => (
          <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{CATEGORY_LABEL[d.category] ?? d.category}</span>
            <p className="text-sm font-semibold mt-1.5" style={{ color: "#1E293B" }}>{d.title}</p>
            {d.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{d.description}</p>}
            <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{fmt(d.created_at)}</p>
          </a>
        ))
      )}
    </div>
  );
}
