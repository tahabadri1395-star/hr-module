import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Open",        bg: "#FEF2F2", color: "#DC2626" },
  in_progress: { label: "In Progress", bg: "#FFFBEB", color: "#B45309" },
  resolved:    { label: "Resolved",    bg: "#F0FDF4", color: "#15803D" },
  closed:      { label: "Closed",      bg: "#F1F5F9", color: "#64748B" },
};
const CATEGORY_META: Record<string, string> = { personal: "Personal", professional: "Professional", grievance: "Grievance", request: "Request" };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function EmployeeArzPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const result = await query(`SELECT * FROM hr_arz WHERE employee_id = $1 ORDER BY created_at DESC`, [empId]);
  const items = result.rows;
  const open = items.filter(a => ["open", "in_progress"].includes(a.status)).length;

  return (
    <div>
      <div className="bg-white rounded-xl px-5 py-4 mb-6 inline-flex items-center gap-3" style={{ boxShadow: "var(--shadow-sm)" }}>
        <span className="text-xl font-bold" style={{ color: open > 0 ? "#DC2626" : "#15803D" }}>{open}</span>
        <span className="text-xs" style={{ color: "#94A3B8" }}>open of {items.length} total requests</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Personal Arz</h2>
        </div>
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No arz submitted.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {items.map(a => {
              const sm = STATUS_META[a.status] ?? STATUS_META.open;
              return (
                <div key={a.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CATEGORY_META[a.category] ?? a.category}</span>
                    {a.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Urgent</span>}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{a.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{a.body}</p>
                  {a.admin_response && (
                    <div className="mt-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: "#F8FAFC" }}>
                      <span className="font-semibold" style={{ color: "#1E293B" }}>Response: </span>
                      <span style={{ color: "#64748B" }}>{a.admin_response}</span>
                      {a.responded_by && <span style={{ color: "#94A3B8" }}> — {a.responded_by}</span>}
                    </div>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{fmt(a.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
