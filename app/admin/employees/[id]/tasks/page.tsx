import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { ink, muted, mutedFaint, glassCard } from "@/lib/desktop-theme";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pending",   bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  ongoing:   { label: "Ongoing",   bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  completed: { label: "Completed", bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
};
const P_COLOR: Record<string, string> = { high: "#FB7185", medium: "#D9B46C", low: "#4ADE80" };
const P_BG: Record<string, string>    = { high: "rgba(244,63,94,0.15)", medium: "rgba(217,180,108,0.15)", low: "rgba(74,222,128,0.15)" };

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function EmployeeTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const result = await query(
    `SELECT * FROM hr_tasks WHERE assigned_to = $1 ORDER BY CASE status WHEN 'ongoing' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END, created_at DESC`,
    [empId]
  );
  const tasks = result.rows;
  const active = tasks.filter(t => t.status !== "completed").length;
  const completed = tasks.filter(t => t.status === "completed").length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl px-5 py-4" style={glassCard}>
          <p className="text-xl font-bold" style={{ color: "#93C5FD" }}>{active}</p>
          <p className="text-xs mt-1" style={{ color: muted }}>Active Tasks</p>
        </div>
        <div className="rounded-xl px-5 py-4" style={glassCard}>
          <p className="text-xl font-bold" style={{ color: "#4ADE80" }}>{completed}</p>
          <p className="text-xs mt-1" style={{ color: muted }}>Completed</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={glassCard}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: ink }}>All Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: mutedFaint }}>No tasks assigned.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {tasks.map(t => {
              const sm = STATUS_META[t.status] ?? STATUS_META.pending;
              const overdue = t.due_date && t.status !== "completed" && new Date(t.due_date) < new Date();
              return (
                <div key={t.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: P_BG[t.priority], color: P_COLOR[t.priority] }}>{t.priority}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                    {overdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Overdue</span>}
                  </div>
                  <p className={`text-sm font-semibold ${t.status === "completed" ? "line-through" : ""}`} style={{ color: t.status === "completed" ? mutedFaint : ink }}>{t.title}</p>
                  {t.description && <p className="text-xs mt-0.5" style={{ color: muted }}>{t.description}</p>}
                  <p className="text-xs mt-1" style={{ color: mutedFaint }}>
                    Assigned by {t.assigned_by}{t.due_date ? ` · Due ${fmt(t.due_date)}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
