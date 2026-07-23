"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Asset {
  id: number; name: string; asset_type: string; serial_number: string | null;
  license_key: string | null; description: string | null; status: string;
  assignment_id: number | null; employee_id: number | null; employee_name: string | null;
  department: string | null; assigned_at: string | null; assignment_notes: string | null;
  created_at: string;
}
interface Employee { id: number; name: string; department: string | null; }

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  laptop:   { label: "Laptop",   color: "#1D4ED8", bg: "#EFF6FF" },
  software: { label: "Software", color: "#7C3AED", bg: "#EDE9FE" },
  paid_app: { label: "Paid App", color: "#059669", bg: "#ECFDF5" },
  hardware: { label: "Hardware", color: "#B45309", bg: "#FFFBEB" },
  other:    { label: "Other",    color: "#475569", bg: "#F8FAFC" },
};
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "#15803D", bg: "#ECFDF5" },
  assigned:    { label: "Assigned",    color: "#1D4ED8", bg: "#EFF6FF" },
  maintenance: { label: "Maintenance", color: "#B45309", bg: "#FFFBEB" },
  retired:     { label: "Retired",     color: "#64748B", bg: "#F8FAFC" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignModal, setAssignModal] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"all" | "available" | "assigned">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // New asset form
  const [form, setForm] = useState({ name: "", asset_type: "laptop", serial_number: "", license_key: "", description: "" });
  // Assign form
  const [assignForm, setAssignForm] = useState({ employee_id: "", notes: "" });

  const load = useCallback(async () => {
    const [aRes, eRes] = await Promise.all([
      fetch("/api/admin/assets"),
      fetch("/api/admin/employees"),
    ]);
    if (aRes.ok) { const d = await aRes.json(); setAssets(d.assets); }
    if (eRes.ok) { const d = await eRes.json(); setEmployees(d.employees ?? []); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAsset() {
    if (!form.name.trim()) { setMsg("Name is required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/assets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ name: "", asset_type: "laptop", serial_number: "", license_key: "", description: "" }); load(); }
    else { const d = await res.json(); setMsg(d.error || "Failed."); }
  }

  async function assignAsset() {
    if (!assignForm.employee_id) { setMsg("Select an employee."); return; }
    setSaving(true);
    await fetch(`/api/admin/assets/${assignModal!.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", employee_id: parseInt(assignForm.employee_id), notes: assignForm.notes || null }),
    });
    setSaving(false);
    setAssignModal(null); setAssignForm({ employee_id: "", notes: "" }); load();
  }

  async function returnAsset(id: number) {
    if (!confirm("Mark this asset as returned?")) return;
    await fetch(`/api/admin/assets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return" }),
    });
    load();
  }

  async function setStatus(id: number, status: string) {
    await fetch(`/api/admin/assets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    });
    load();
  }

  async function deleteAsset(id: number, name: string) {
    if (!confirm(`Delete "${name}"? All assignment history will be lost.`)) return;
    await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = assets.filter(a => {
    if (tab === "available" && a.status !== "available") return false;
    if (tab === "assigned" && a.status !== "assigned") return false;
    if (typeFilter !== "all" && a.asset_type !== typeFilter) return false;
    return true;
  });

  const counts = {
    total: assets.length,
    available: assets.filter(a => a.status === "available").length,
    assigned: assets.filter(a => a.status === "assigned").length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <nav className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto sticky top-0 z-20" style={{ backgroundColor: "#0F172A" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-sm text-white">HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
      </nav>

      {/* Stats strip */}
      <div className="px-6 pb-6 pt-2 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Asset Tracking</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Manage equipment, software and paid apps</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + Add Asset
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Assets", value: counts.total, color: "#94A3B8" },
            { label: "Available",    value: counts.available, color: "#4ADE80" },
            { label: "Assigned",     value: counts.assigned, color: "#60A5FA" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "#1E293B" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-6xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Add Asset Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>Add New Asset</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dell XPS 15, Adobe CC, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Type *</label>
                <select value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="laptop">Laptop</option>
                  <option value="software">Software</option>
                  <option value="paid_app">Paid App</option>
                  <option value="hardware">Hardware</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Serial Number</label>
                <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>License Key</label>
                <input value={form.license_key} onChange={e => setForm(f => ({ ...f, license_key: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief notes about this asset"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </div>
            <div className="flex gap-3">
              <button onClick={createAsset} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Adding…" : "Add Asset"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-sm font-bold mb-1" style={{ color: "#1E293B" }}>Assign Asset</h2>
              <p className="text-xs mb-4" style={{ color: "#64748B" }}>{assignModal.name}</p>
              {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Assign To *</label>
                  <select value={assignForm.employee_id} onChange={e => setAssignForm(f => ({ ...f, employee_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                    <option value="">Select Khidmat Guzar…</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Notes (optional)</label>
                  <input value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Condition, purpose, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={assignAsset} disabled={saving}
                  className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                  style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Assigning…" : "Assign"}
                </button>
                <button onClick={() => { setAssignModal(null); setAssignForm({ employee_id: "", notes: "" }); setMsg(""); }}
                  className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
            {(["all", "available", "assigned"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize"
                style={{ backgroundColor: tab === t ? "#0F172A" : "transparent", color: tab === t ? "white" : "#64748B" }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
            {["all", "laptop", "software", "paid_app", "hardware", "other"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: typeFilter === t ? "#0F172A" : "transparent", color: typeFilter === t ? "white" : "#64748B" }}>
                {t === "all" ? "All Types" : TYPE_META[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {/* Asset List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No assets found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Add assets using the button above</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(asset => {
              const type = TYPE_META[asset.asset_type] || TYPE_META.other;
              const status = STATUS_META[asset.status] || STATUS_META.available;
              const isOpen = expanded === asset.id;
              return (
                <div key={asset.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="px-5 py-3.5 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : asset.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: type.bg, color: type.color }}>{type.label}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{asset.name}</p>
                      {asset.employee_name && (
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                          {asset.employee_name}{asset.department ? ` · ${asset.department}` : ""}
                          {asset.assigned_at ? ` · since ${fmt(asset.assigned_at)}` : ""}
                        </p>
                      )}
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: "#F8FAFC" }}>
                      {asset.description && <p className="text-sm mt-3 mb-2" style={{ color: "#64748B" }}>{asset.description}</p>}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                        {asset.serial_number && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: "#94A3B8" }}>Serial:</span>
                            <code className="text-xs font-mono" style={{ color: "#1E293B" }}>{asset.serial_number}</code>
                          </div>
                        )}
                        {asset.license_key && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: "#94A3B8" }}>License:</span>
                            <code className="text-xs font-mono" style={{ color: "#1E293B" }}>{asset.license_key}</code>
                          </div>
                        )}
                      </div>
                      {asset.assignment_notes && (
                        <p className="text-xs mt-2 italic" style={{ color: "#94A3B8" }}>Note: {asset.assignment_notes}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {asset.status === "available" && (
                          <button onClick={() => { setAssignModal(asset); setMsg(""); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-black"
                            style={{ backgroundColor: "#F59E0B" }}>
                            Assign to KG
                          </button>
                        )}
                        {asset.status === "assigned" && (
                          <button onClick={() => returnAsset(asset.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "#BBF7D0", color: "#16A34A", backgroundColor: "#F0FDF4" }}>
                            Mark Returned
                          </button>
                        )}
                        {asset.status !== "maintenance" && asset.status !== "retired" && (
                          <button onClick={() => setStatus(asset.id, "maintenance")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "#FDE68A", color: "#B45309", backgroundColor: "#FFFBEB" }}>
                            Maintenance
                          </button>
                        )}
                        {asset.status === "maintenance" && (
                          <button onClick={() => setStatus(asset.id, "available")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "#BBF7D0", color: "#16A34A", backgroundColor: "#F0FDF4" }}>
                            Mark Available
                          </button>
                        )}
                        {asset.status !== "retired" && (
                          <button onClick={() => setStatus(asset.id, "retired")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
                            Retire
                          </button>
                        )}
                        <button onClick={() => deleteAsset(asset.id, asset.name)}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
