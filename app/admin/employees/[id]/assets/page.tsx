import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const TYPE_LABEL: Record<string, string> = {
  laptop: "Laptop", software: "Software", paid_app: "Paid App", hardware: "Hardware", other: "Other",
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function EmployeeAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const result = await query(
    `SELECT aa.*, a.name, a.asset_type, a.serial_number, a.license_key, a.description
     FROM hr_asset_assignments aa
     JOIN hr_assets a ON a.id = aa.asset_id
     WHERE aa.employee_id = $1
     ORDER BY aa.assigned_at DESC`,
    [empId]
  );
  const assignments = result.rows;
  const active = assignments.filter(a => a.status === "active");
  const returned = assignments.filter(a => a.status === "returned");

  return (
    <div>
      <div className="bg-white rounded-xl px-5 py-4 mb-6 inline-flex items-center gap-3" style={{ boxShadow: "var(--shadow-sm)" }}>
        <span className="text-xl font-bold" style={{ color: "#4F46E5" }}>{active.length}</span>
        <span className="text-xs" style={{ color: "#94A3B8" }}>assets currently assigned</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Asset Assignment History</h2>
        </div>
        {assignments.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No assets assigned to this Khidmat Guzar.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {[...active, ...returned].map(a => (
              <div key={a.id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{TYPE_LABEL[a.asset_type] ?? a.asset_type}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: a.status === "active" ? "#F0FDF4" : "#F1F5F9", color: a.status === "active" ? "#15803D" : "#64748B" }}>
                      {a.status === "active" ? "Currently Assigned" : "Returned"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{a.name}</p>
                  {(a.serial_number || a.license_key) && (
                    <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                      {a.serial_number && <span>S/N: {a.serial_number}</span>}
                      {a.serial_number && a.license_key && <span> · </span>}
                      {a.license_key && <span>License: {a.license_key}</span>}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    Assigned {fmt(a.assigned_at)} by {a.assigned_by}{a.returned_at ? ` · Returned ${fmt(a.returned_at)}` : ""}
                  </p>
                  {a.notes && <p className="text-xs mt-0.5 italic" style={{ color: "#94A3B8" }}>{a.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
