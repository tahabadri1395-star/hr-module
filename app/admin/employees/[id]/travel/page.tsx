import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: "Pending",  bg: "#FFFBEB", color: "#B45309" },
  approved: { label: "Approved", bg: "#F0FDF4", color: "#15803D" },
  rejected: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
};
const TYPE_META: Record<string, string> = { site_visit: "Site Visit", outstation: "Outstation", local: "Local Travel" };
const CAT_META: Record<string, string> = {
  travel: "Travel", food: "Food", accommodation: "Accommodation",
  office_supplies: "Office Supplies", communication: "Communication", other: "Other",
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtAmount(a: string) { return `₹${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default async function EmployeeTravelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empId = parseInt(id);
  if (isNaN(empId)) notFound();

  const [travelResult, expensesResult] = await Promise.all([
    query(`SELECT * FROM hr_travel_requests WHERE employee_id = $1 ORDER BY created_at DESC`, [empId]),
    query(`SELECT * FROM hr_expenses WHERE employee_id = $1 ORDER BY created_at DESC`, [empId]),
  ]);
  const travel = travelResult.rows;
  const expenses = expensesResult.rows;

  const totalReimbursed = expenses.filter(e => e.status === "approved").reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-xl font-bold" style={{ color: "#B45309" }}>{travel.filter(t => t.status === "pending").length}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Pending Travel</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-xl font-bold" style={{ color: "#0891B2" }}>{expenses.filter(e => e.status === "pending").length}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Pending Claims</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-xl font-bold" style={{ color: "#15803D" }}>{fmtAmount(totalReimbursed.toString())}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Total Reimbursed</p>
        </div>
      </div>

      {/* Travel Requests */}
      <div className="bg-white rounded-xl overflow-hidden mb-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Travel Requests</h2>
        </div>
        {travel.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No travel requests on record.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {travel.map(t => {
              const sm = STATUS_META[t.status] ?? STATUS_META.pending;
              return (
                <div key={t.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{TYPE_META[t.travel_type] ?? t.travel_type}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{t.destination}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{t.purpose}</p>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    {fmt(t.travel_date)}{t.return_date ? ` → ${fmt(t.return_date)}` : ""}
                    {t.estimated_cost ? ` · Est. ₹${parseFloat(t.estimated_cost).toLocaleString()}` : ""}
                  </p>
                  {t.admin_note && <p className="text-xs mt-1 italic" style={{ color: "#64748B" }}>Note: {t.admin_note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Claims */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Expense Claims</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No expense claims on record.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {expenses.map(e => {
              const sm = STATUS_META[e.status] ?? STATUS_META.pending;
              return (
                <div key={e.id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{CAT_META[e.category] ?? e.category}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{e.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(e.expense_date)}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: "#1E293B" }}>{fmtAmount(e.amount)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
