import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { ink, muted, mutedFaint, glassCard, glassPill } from "@/lib/desktop-theme";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Open",        bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  in_progress: { label: "In Progress", bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  resolved:    { label: "Resolved",    bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
  closed:      { label: "Closed",      bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
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
      <div className="rounded-xl px-5 py-4 mb-6 inline-flex items-center gap-3" style={glassCard}>
        <span className="text-xl font-bold" style={{ color: open > 0 ? "#F87171" : "#4ADE80" }}>{open}</span>
        <span className="text-xs" style={{ color: muted }}>open of {items.length} total requests</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={glassCard}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: ink }}>Personal Arz</h2>
        </div>
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: mutedFaint }}>No arz submitted.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {items.map(a => {
              const sm = STATUS_META[a.status] ?? STATUS_META.open;
              return (
                <div key={a.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={glassPill}>{CATEGORY_META[a.category] ?? a.category}</span>
                    {a.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Urgent</span>}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: ink }}>{a.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>{a.body}</p>
                  {a.admin_response && (
                    <div className="mt-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <span className="font-semibold" style={{ color: ink }}>Response: </span>
                      <span style={{ color: muted }}>{a.admin_response}</span>
                      {a.responded_by && <span style={{ color: mutedFaint }}> — {a.responded_by}</span>}
                    </div>
                  )}
                  <p className="text-xs mt-1" style={{ color: mutedFaint }}>{fmt(a.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
