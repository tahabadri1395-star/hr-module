"use client";

import { useState, useEffect, useCallback } from "react";

interface Holiday {
  id: number;
  date: string;
  name: string;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function HolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/holidays");
    const data = await res.json();
    setHolidays(data.holidays ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setForm({ date: "", name: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
    load();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Add form */}
      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#E2E8F0" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#1E293B" }}>Add Public Holiday</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={form.date}
            min={today}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            required
            className="px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            onFocus={e => (e.target.style.borderColor = "#4F46E5")}
            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
          />
          <input
            type="text"
            value={form.name}
            placeholder="Holiday name (e.g. Eid ul Fitr)"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            onFocus={e => (e.target.style.borderColor = "#4F46E5")}
            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Adding…" : "Add Holiday"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs" style={{ color: "#DC2626" }}>{error}</p>}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Public Holidays</h3>
          <span className="text-xs" style={{ color: "#94A3B8" }}>{holidays.length} total</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>Loading…</div>
        ) : holidays.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No public holidays added yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {holidays.map(h => (
              <div key={h.id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4F46E5" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{h.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{formatDate(h.date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-70"
                  style={{ borderColor: "#FECDD3", color: "#DC2626" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
