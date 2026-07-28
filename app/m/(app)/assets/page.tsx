import { getEmployeeFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const TYPE_LABEL: Record<string, string> = {
  laptop: "Laptop", software: "Software", paid_app: "Paid App", hardware: "Hardware", other: "Other",
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function MobileAssetsPage() {
  const employee = await getEmployeeFromCookies();
  if (!employee) redirect("/m/login");

  const result = await query(
    `SELECT a.*, aa.assigned_at, aa.notes
     FROM hr_asset_assignments aa
     JOIN hr_assets a ON a.id = aa.asset_id
     WHERE aa.employee_id=$1 AND aa.status='active'
     ORDER BY aa.assigned_at DESC`,
    [employee.id]
  );
  const assets = result.rows;

  return (
    <div className="space-y-2.5 pb-2">
      {assets.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center text-sm" style={{ color: "#94A3B8", boxShadow: "var(--shadow-sm)" }}>No assets currently assigned.</div>
      ) : (
        assets.map(a => (
          <div key={a.id} className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{TYPE_LABEL[a.asset_type] ?? a.asset_type}</span>
            <p className="text-sm font-semibold mt-1.5" style={{ color: "#1E293B" }}>{a.name}</p>
            {(a.serial_number || a.license_key) && (
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                {a.serial_number && <span>S/N: {a.serial_number}</span>}
                {a.serial_number && a.license_key && <span> · </span>}
                {a.license_key && <span>License: {a.license_key}</span>}
              </p>
            )}
            <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>Assigned {fmt(a.assigned_at)}</p>
          </div>
        ))
      )}
    </div>
  );
}
