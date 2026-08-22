"use client";

import { useState, useEffect, useCallback } from "react";
import { ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

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
  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div>
      {/* Add form */}
      <div className="rounded-xl p-6 mb-6" style={glassCard}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: ink }}>Add Public Holiday</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={form.date}
            min={today}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            required
            className="px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = gold)}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
          />
          <input
            type="text"
            value={form.name}
            placeholder="Holiday name (e.g. Eid ul Fitr)"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = gold)}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium shrink-0"
            style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Adding…" : "Add Holiday"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs" style={{ color: "#F87171" }}>{error}</p>}
      </div>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={glassCard}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h3 className="text-sm font-semibold" style={{ color: ink }}>Public Holidays</h3>
          <span className="text-xs" style={{ color: muted }}>{holidays.length} total</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: muted }}>Loading…</div>
        ) : holidays.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: muted }}>No public holidays added yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {holidays.map(h => (
              <div key={h.id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gold }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: ink }}>{h.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>{formatDate(h.date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-70"
                  style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171" }}
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
