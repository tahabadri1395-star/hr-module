import { notFound } from "next/navigation";
import { query } from "@/lib/db";

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function EmployeeMurasalatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const empRes = await query(`SELECT department FROM hr_employees WHERE id = $1`, [empId]);
  const dept: string | null = empRes.rows[0]?.department ?? null;

  const result = await query(
    `SELECT m.*, CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read, mr.read_at
     FROM hr_murasalat m
     LEFT JOIN hr_murasalat_reads mr ON mr.murasalat_id = m.id AND mr.employee_id = $1
     WHERE m.department IS NULL OR m.department = $2
     ORDER BY m.created_at DESC`,
    [empId, dept ?? ""]
  );
  const items = result.rows;
  const unread = items.filter(m => !m.is_read).length;

  return (
    <div>
      <div className="bg-white rounded-xl px-5 py-4 mb-6 inline-flex items-center gap-3" style={{ boxShadow: "var(--shadow-sm)" }}>
        <span className="text-xl font-bold" style={{ color: unread > 0 ? "#DC2626" : "#15803D" }}>{unread}</span>
        <span className="text-xs" style={{ color: "#94A3B8" }}>unread of {items.length} circulars visible to this Khidmat Guzar</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Murasalat</h2>
        </div>
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No circulars apply to this Khidmat Guzar.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {items.map(m => (
              <div key={m.id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {m.priority === "urgent" && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Urgent</span>}
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{m.title}</p>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#64748B" }}>{m.body}</p>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{fmt(m.created_at)}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: m.is_read ? "#F0FDF4" : "#FEF2F2", color: m.is_read ? "#15803D" : "#DC2626" }}>
                  {m.is_read ? "Read" : "Unread"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
