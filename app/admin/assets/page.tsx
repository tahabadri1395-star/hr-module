"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Asset {
  id: number; name: string; asset_type: string; serial_number: string | null;
  license_key: string | null; description: string | null; status: string;
  assignment_id: number | null; employee_id: number | null; employee_name: string | null;
  department: string | null; assigned_at: string | null; assignment_notes: string | null;
  created_at: string;
}
interface Employee { id: number; name: string; department: string | null; }

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  laptop:   { label: "Laptop",   color: "#93C5FD", bg: "rgba(96,165,250,0.15)" },
  software: { label: "Software", color: "#C4B5FD", bg: "rgba(167,139,250,0.15)" },
  paid_app: { label: "Paid App", color: "#6EE7B7", bg: "rgba(52,211,153,0.15)" },
  hardware: { label: "Hardware", color: "#D9B46C", bg: "rgba(217,180,108,0.15)" },
  other:    { label: "Other",    color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.08)" },
};
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  assigned:    { label: "Assigned",    color: "#93C5FD", bg: "rgba(96,165,250,0.15)" },
  maintenance: { label: "Maintenance", color: "#D9B46C", bg: "rgba(217,180,108,0.15)" },
  retired:     { label: "Retired",     color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.08)" },
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

  const modalInputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.06)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: "#F59E0B" }}>
            <img src="/estate-mark.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Asset Tracking</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Manage equipment, software and paid apps</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + Add Asset
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Assets", value: counts.total, color: ink },
            { label: "Available",    value: counts.available, color: "#4ADE80" },
            { label: "Assigned",     value: counts.assigned, color: "#93C5FD" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={glassCard}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add Asset Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-5" style={{ ...glassCard, border: "1px solid rgba(217,180,108,0.4)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: ink }}>Add New Asset</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dell XPS 15, Adobe CC, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input"
                  style={modalInputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Type *</label>
                <select value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={modalInputStyle}>
                  <option value="laptop">Laptop</option>
                  <option value="software">Software</option>
                  <option value="paid_app">Paid App</option>
                  <option value="hardware">Hardware</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Serial Number</label>
                <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono glass-input"
                  style={modalInputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>License Key</label>
                <input value={form.license_key} onChange={e => setForm(f => ({ ...f, license_key: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono glass-input"
                  style={modalInputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief notes about this asset"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input"
                style={modalInputStyle}
                onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
            </div>
            <div className="flex gap-3">
              <button onClick={createAsset} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Adding…" : "Add Asset"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div className="rounded-2xl p-6 w-full max-w-md" style={{ ...glassCard, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", backgroundColor: "rgba(30,25,60,0.9)" }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: ink }}>Assign Asset</h2>
              <p className="text-xs mb-4" style={{ color: muted }}>{assignModal.name}</p>
              {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Assign To *</label>
                  <select value={assignForm.employee_id} onChange={e => setAssignForm(f => ({ ...f, employee_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={modalInputStyle}>
                    <option value="">Select Khidmat Guzar…</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Notes (optional)</label>
                  <input value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Condition, purpose, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input"
                    style={modalInputStyle} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={assignAsset} disabled={saving}
                  className="text-sm font-semibold px-5 py-2 rounded-xl"
                  style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Assigning…" : "Assign"}
                </button>
                <button onClick={() => { setAssignModal(null); setAssignForm({ employee_id: "", notes: "" }); setMsg(""); }}
                  className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={glassPill}>
            {(["all", "available", "assigned"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize"
                style={{ backgroundColor: tab === t ? gold : "transparent", color: tab === t ? "#1B1630" : muted }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={glassPill}>
            {["all", "laptop", "software", "paid_app", "hardware", "other"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: typeFilter === t ? gold : "transparent", color: typeFilter === t ? "#1B1630" : muted }}>
                {t === "all" ? "All Types" : TYPE_META[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {/* Asset List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No assets found</p>
            <p className="text-xs mt-1" style={{ color: mutedFaint }}>Add assets using the button above</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(asset => {
              const type = TYPE_META[asset.asset_type] || TYPE_META.other;
              const status = STATUS_META[asset.status] || STATUS_META.available;
              const isOpen = expanded === asset.id;
              return (
                <div key={asset.id} className="rounded-2xl overflow-hidden" style={glassCard}>
                  <div className="px-5 py-3.5 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : asset.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: type.bg, color: type.color }}>{type.label}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{asset.name}</p>
                      {asset.employee_name && (
                        <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>
                          {asset.employee_name}{asset.department ? ` · ${asset.department}` : ""}
                          {asset.assigned_at ? ` · since ${fmt(asset.assigned_at)}` : ""}
                        </p>
                      )}
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      {asset.description && <p className="text-sm mt-3 mb-2" style={{ color: muted }}>{asset.description}</p>}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                        {asset.serial_number && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: mutedFaint }}>Serial:</span>
                            <code className="text-xs font-mono" style={{ color: ink }}>{asset.serial_number}</code>
                          </div>
                        )}
                        {asset.license_key && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: mutedFaint }}>License:</span>
                            <code className="text-xs font-mono" style={{ color: ink }}>{asset.license_key}</code>
                          </div>
                        )}
                      </div>
                      {asset.assignment_notes && (
                        <p className="text-xs mt-2 italic" style={{ color: mutedFaint }}>Note: {asset.assignment_notes}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {asset.status === "available" && (
                          <button onClick={() => { setAssignModal(asset); setMsg(""); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: gold, color: "#1B1630" }}>
                            Assign to KG
                          </button>
                        )}
                        {asset.status === "assigned" && (
                          <button onClick={() => returnAsset(asset.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ADE80", backgroundColor: "rgba(74,222,128,0.1)" }}>
                            Mark Returned
                          </button>
                        )}
                        {asset.status !== "maintenance" && asset.status !== "retired" && (
                          <button onClick={() => setStatus(asset.id, "maintenance")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "rgba(217,180,108,0.3)", color: "#D9B46C", backgroundColor: "rgba(217,180,108,0.1)" }}>
                            Maintenance
                          </button>
                        )}
                        {asset.status === "maintenance" && (
                          <button onClick={() => setStatus(asset.id, "available")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ADE80", backgroundColor: "rgba(74,222,128,0.1)" }}>
                            Mark Available
                          </button>
                        )}
                        {asset.status !== "retired" && (
                          <button onClick={() => setStatus(asset.id, "retired")}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                            Retire
                          </button>
                        )}
                        <button onClick={() => deleteAsset(asset.id, asset.name)}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>
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
