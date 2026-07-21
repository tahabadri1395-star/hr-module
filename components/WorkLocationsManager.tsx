"use client";

import { useState, useEffect, useCallback } from "react";

interface WorkLocation {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
}

export default function WorkLocationsManager() {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_meters: "150" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/work-locations");
    const data = await res.json();
    setLocations(data.locations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/work-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setForm({ name: "", latitude: "", longitude: "", radius_meters: "150" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this work location? Employees will no longer be able to clock in/out against it.")) return;
    await fetch(`/api/admin/work-locations/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#E2E8F0" }}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: "#1E293B" }}>Add Work Location</h3>
        <p className="text-xs mb-4" style={{ color: "#94A3B8" }}>
          Employees can only clock in/out from within the radius of a registered site. Find coordinates via
          Google Maps: right-click a spot &rarr; the lat/long appears at the top of the menu.
        </p>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={form.name}
            placeholder="Site name (e.g. Saifee Burhani Park)"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="sm:col-span-2 px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
          <input
            type="text"
            inputMode="decimal"
            value={form.latitude}
            placeholder="Latitude"
            onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
            required
            className="px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
          <input
            type="text"
            inputMode="decimal"
            value={form.longitude}
            placeholder="Longitude"
            onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
            required
            className="px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
          <input
            type="number"
            min="10"
            value={form.radius_meters}
            placeholder="Radius (meters)"
            onChange={e => setForm(f => ({ ...f, radius_meters: e.target.value }))}
            className="px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
          <button
            type="submit"
            disabled={saving}
            className="sm:col-span-3 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Adding…" : "Add Location"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs" style={{ color: "#DC2626" }}>{error}</p>}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Registered Work Locations</h3>
          <span className="text-xs" style={{ color: "#94A3B8" }}>{locations.length} total</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>Loading…</div>
        ) : locations.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>
            No work locations yet — clock in/out won&apos;t be restricted until you add at least one.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
            {locations.map(l => (
              <div key={l.id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4F46E5" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{l.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {parseFloat(l.latitude).toFixed(5)}, {parseFloat(l.longitude).toFixed(5)} &middot; {l.radius_meters}m radius
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(l.id)}
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
