import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pending",   bg: "#FFFBEB", color: "#B45309" },
  ongoing:   { label: "Ongoing",   bg: "#EFF6FF", color: "#1D4ED8" },
  completed: { label: "Completed", bg: "#F0FDF4", color: "#15803D" },
};
const P_COLOR: Record<string, string> = { high: "#E11D48", medium: "#B45309", low: "#15803D" };
const P_BG: Record<string, string>    = { high: "#FFF1F2", medium: "#FFFBEB", low: "#F0FDF4" };

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
        <div className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-xl font-bold" style={{ color: "#1D4ED8" }}>{active}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Active Tasks</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-xl font-bold" style={{ color: "#15803D" }}>{completed}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Completed</p>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>All Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No tasks assigned.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {tasks.map(t => {
              const sm = STATUS_META[t.status] ?? STATUS_META.pending;
              const overdue = t.due_date && t.status !== "completed" && new Date(t.due_date) < new Date();
              return (
                <div key={t.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: P_BG[t.priority], color: P_COLOR[t.priority] }}>{t.priority}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                    {overdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Overdue</span>}
                  </div>
                  <p className={`text-sm font-semibold ${t.status === "completed" ? "line-through" : ""}`} style={{ color: t.status === "completed" ? "#94A3B8" : "#1E293B" }}>{t.title}</p>
                  {t.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{t.description}</p>}
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
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
