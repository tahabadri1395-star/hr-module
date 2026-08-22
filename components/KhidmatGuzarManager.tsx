"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

interface KG {
  id: number;
  name: string;
  email: string;
  department: string | null;
  employee_code: string | null;
  active: number;
  created_at: string;
}

const EMPTY_FORM = { name: "", email: "", department: "", employee_code: "", password: "" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function KhidmatGuzarManager() {
  const [list, setList] = useState<KG[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState<Partial<KG & { new_password: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showPasswordFor, setShowPasswordFor] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (res.ok) setList(data.list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(`${form.name} added successfully.`);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: number) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash("Updated successfully.");
      setEditingId(null);
      setEditForm({});
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (kg: KG) => {
    try {
      const res = await fetch(`/api/admin/employees/${kg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: kg.active ? 0 : 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(`${kg.name} ${kg.active ? "deactivated" : "activated"}.`);
      load();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed.", true);
    }
  };

  const handleDelete = async (kg: KG) => {
    if (!confirm(`Remove "${kg.name}"? If they have leave history they will be deactivated instead.`)) return;
    try {
      const res = await fetch(`/api/admin/employees/${kg.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(data.message);
      load();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed.", true);
    }
  };

  const handleResetPassword = async (kg: KG) => {
    if (!newPassword.trim()) { flash("Enter a new password first.", true); return; }
    setResetSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${kg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(`Password reset for ${kg.name}.`);
      setNewPassword("");
      setShowPasswordFor(null);
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : "Failed.", true);
    } finally {
      setResetSaving(false);
    }
  };

  const startEdit = (kg: KG) => {
    setEditingId(kg.id);
    setEditForm({ name: kg.name, email: kg.email, department: kg.department ?? "", employee_code: kg.employee_code ?? "" });
    setShowAdd(false);
  };

  const filtered = list.filter(kg => {
    const matchSearch = !search || kg.name.toLowerCase().includes(search.toLowerCase()) ||
      kg.email.toLowerCase().includes(search.toLowerCase()) ||
      (kg.department ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (kg.employee_code ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? kg.active === 1 : kg.active === 0);
    return matchSearch && matchFilter;
  });

  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Khidmat Guzar Management</h1>
            <p className="text-sm mt-1" style={{ color: muted }}>
              Add, edit, and manage all Khidmat Guzars in the system
            </p>
          </div>
          <button
            onClick={() => { setShowAdd(v => !v); setEditingId(null); setError(""); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            {showAdd ? "✕ Cancel" : "+ Add Khidmat Guzar"}
          </button>
        </div>

        {/* Flash messages */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>
            {success}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="rounded-xl p-6 mb-6" style={glassCard}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: ink }}>Add New Khidmat Guzar</h2>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>
                    Full Name <span style={{ color: "#F87171" }}>*</span>
                  </label>
                  <input
                    type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ahmed Ali"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                    required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>
                    Email <span style={{ color: "#F87171" }}>*</span>
                  </label>
                  <input
                    type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                    required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Department</label>
                  <input
                    type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Operations"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>ID / Code</label>
                  <input
                    type="text" value={form.employee_code} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))}
                    placeholder="e.g. KG-001"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>
                    Initial Password <span style={{ color: "#F87171" }}>*</span>
                  </label>
                  <input
                    type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Set a login password"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                    required />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
                  className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Adding…" : "Add Khidmat Guzar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke={mutedFaint} strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke={mutedFaint} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, department…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none glass-input"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = gold)}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
          </div>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
            {(["all", "active", "inactive"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 text-xs font-medium capitalize transition-colors"
                style={filter === f
                  ? { backgroundColor: gold, color: "#1B1630" }
                  : { backgroundColor: "transparent", color: muted }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total",    value: list.length,                       color: gold },
            { label: "Active",   value: list.filter(k => k.active).length,  color: "#4ADE80" },
            { label: "Inactive", value: list.filter(k => !k.active).length, color: "#F87171" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-5 py-3.5" style={glassCard}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>{s.label} Khidmat Guzars</p>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-xl py-16 text-center" style={glassCard}>
            <p className="text-sm" style={{ color: muted }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={glassCard}>
            <p className="font-medium text-sm mb-1" style={{ color: ink }}>
              {search ? "No matches found" : "No Khidmat Guzars yet"}
            </p>
            <p className="text-xs" style={{ color: muted }}>
              {search ? "Try a different search term" : "Click \"Add Khidmat Guzar\" to get started"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={glassCard}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-medium" style={{ color: muted }}>
                Showing {filtered.length} of {list.length}
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {filtered.map(kg => (
                <div key={kg.id}>
                  {editingId === kg.id ? (
                    /* ── Edit row ── */
                    <div className="p-5" style={{ backgroundColor: "rgba(217,180,108,0.06)" }}>
                      <p className="text-xs font-semibold mb-4" style={{ color: gold }}>Editing: {kg.name}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {[
                          { key: "name",          label: "Full Name",   type: "text",  placeholder: "Full name" },
                          { key: "email",         label: "Email",       type: "email", placeholder: "Email address" },
                          { key: "department",    label: "Department",  type: "text",  placeholder: "Department" },
                          { key: "employee_code", label: "ID / Code",   type: "text",  placeholder: "KG-001" },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium mb-1" style={{ color: muted }}>{f.label}</label>
                            <input
                              type={f.type}
                              value={(editForm as Record<string, string>)[f.key] ?? ""}
                              onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))}
                              placeholder={f.placeholder}
                              className="w-full px-3 py-2 rounded-lg text-sm border outline-none glass-input"
                              style={inputStyle}
                              onFocus={e => (e.target.style.borderColor = gold)}
                              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(kg.id)} disabled={saving}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                          {saving ? "Saving…" : "Save Changes"}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditForm({}); }}
                          className="px-4 py-1.5 rounded-lg text-xs border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ── */
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ background: kg.active ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "rgba(255,255,255,0.15)" }}>
                            {kg.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold" style={{ color: kg.active ? ink : mutedFaint }}>
                                {kg.name}
                              </p>
                              {kg.employee_code && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(217,180,108,0.15)", color: gold }}>
                                  {kg.employee_code}
                                </span>
                              )}
                              {!kg.active && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: muted }}>{kg.email}</p>
                            <p className="text-xs" style={{ color: mutedFaint }}>
                              {kg.department ? `${kg.department} · ` : ""}Added {formatDate(kg.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          <Link href={`/admin/employees/${kg.id}/overview`}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ borderColor: "rgba(255,255,255,0.16)", color: gold }}>
                            Dashboard
                          </Link>
                          <button onClick={() => startEdit(kg)}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleActive(kg)}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={kg.active
                              ? { borderColor: "rgba(251,146,60,0.35)", color: "#FB923C", backgroundColor: "rgba(251,146,60,0.1)" }
                              : { borderColor: "rgba(74,222,128,0.35)", color: "#4ADE80", backgroundColor: "rgba(74,222,128,0.1)" }}>
                            {kg.active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => { setShowPasswordFor(showPasswordFor === kg.id ? null : kg.id); setNewPassword(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>
                            Reset Password
                          </button>
                          <button onClick={() => handleDelete(kg)}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Inline password reset */}
                      {showPasswordFor === kg.id && (
                        <div className="mt-3 flex gap-2 items-center" style={{ paddingLeft: "52px" }}>
                          <input
                            type="text" value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password…"
                            className="flex-1 max-w-xs px-3 py-1.5 rounded-lg text-xs border outline-none glass-input"
                            style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = gold)}
                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
                          <button onClick={() => handleResetPassword(kg)} disabled={resetSaving}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: gold, color: "#1B1630", opacity: resetSaving ? 0.7 : 1 }}>
                            {resetSaving ? "Saving…" : "Set Password"}
                          </button>
                          <button onClick={() => { setShowPasswordFor(null); setNewPassword(""); }}
                            className="text-xs" style={{ color: mutedFaint }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
