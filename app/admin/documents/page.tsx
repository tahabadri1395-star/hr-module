"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Doc {
  id: number; title: string; description: string | null; category: string;
  file_url: string; department: string | null; created_by: string; created_at: string;
}

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  policy:      { label: "Policy",      color: "#1D4ED8", bg: "#EFF6FF" },
  form:        { label: "Form",        color: "#7C3AED", bg: "#EDE9FE" },
  certificate: { label: "Certificate", color: "#B45309", bg: "#FFFBEB" },
  circular:    { label: "Circular",    color: "#0891B2", bg: "#ECFEFF" },
  sop:         { label: "SOP",         color: "#059669", bg: "#ECFDF5" },
  other:       { label: "Other",       color: "#475569", bg: "#F8FAFC" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", category: "policy", file_url: "", department: "" });

  const load = useCallback(async () => {
    const [dRes, eRes] = await Promise.all([
      fetch("/api/admin/documents"),
      fetch("/api/admin/employees"),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDocs(d.documents); }
    if (eRes.ok) { const d = await eRes.json(); setDepartments([...new Set((d.employees ?? []).map((e: { department: string | null }) => e.department).filter(Boolean))] as string[]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(doc: Doc) {
    setEditDoc(doc);
    setForm({ title: doc.title, description: doc.description ?? "", category: doc.category, file_url: doc.file_url, department: doc.department ?? "" });
    setMsg("");
  }

  async function save() {
    if (!form.title.trim() || !form.file_url.trim()) { setMsg("Title and link are required."); return; }
    setSaving(true); setMsg("");
    if (editDoc) {
      await fetch(`/api/admin/documents/${editDoc.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, department: form.department || null }),
      });
    } else {
      const res = await fetch("/api/admin/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, department: form.department || null }),
      });
      if (!res.ok) { const d = await res.json(); setSaving(false); setMsg(d.error || "Failed."); return; }
    }
    setSaving(false);
    setShowForm(false); setEditDoc(null); setForm({ title: "", description: "", category: "policy", file_url: "", department: "" });
    load();
  }

  async function del(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = docs.filter(d => {
    if (catFilter !== "all" && d.category !== catFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isFormOpen = showForm || editDoc !== null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      <nav className="px-6 h-14 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-sm text-white">HR Module</span>
        </div>
        <Link href="/admin" className="text-xs" style={{ color: "#475569" }}>← Dashboard</Link>
      </nav>

      <div className="px-6 pb-6 pt-2 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Document Vault</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Manage policies, forms and official documents</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditDoc(null); setForm({ title: "", description: "", category: "policy", file_url: "", department: "" }); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + Add Document
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {Object.entries(CAT_META).map(([c, meta]) => {
            const count = docs.filter(d => d.category === c).length;
            if (!count) return null;
            return (
              <div key={c} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}>
                <span style={{ color: meta.color }}>{meta.label}</span> · {count}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-5xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>{editDoc ? "Edit Document" : "Add Document"}</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Leave Policy 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="policy">Policy</option>
                  <option value="form">Form</option>
                  <option value="certificate">Certificate</option>
                  <option value="circular">Circular</option>
                  <option value="sop">SOP</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Department (blank = all)</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="">All Khidmat Guzars</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Document Link * <span style={{ color: "#94A3B8" }}>(Google Drive, OneDrive, etc.)</span></label>
                <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                  placeholder="https://drive.google.com/…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Brief description of this document…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editDoc ? "Save Changes" : "Add Document"}
              </button>
              <button onClick={() => { setShowForm(false); setEditDoc(null); }} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs border bg-white outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-white shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
            {["all", "policy", "form", "certificate", "circular", "sop", "other"].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: catFilter === c ? "#0F172A" : "transparent", color: catFilter === c ? "white" : "#64748B" }}>
                {c === "all" ? "All" : CAT_META[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No documents</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Add documents using the button above</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(doc => {
              const meta = CAT_META[doc.category] || CAT_META.other;
              return (
                <div key={doc.id} className="bg-white rounded-2xl px-5 py-4 flex items-start gap-3" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: meta.bg }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                          {doc.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{doc.department}</span>}
                        </div>
                        <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{doc.title}</p>
                        {doc.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#64748B" }}>{doc.description}</p>}
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{fmt(doc.created_at)} · {doc.created_by}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-black"
                          style={{ backgroundColor: "#F59E0B" }}>
                          Open
                        </a>
                        <button onClick={() => openEdit(doc)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                          Edit
                        </button>
                        <button onClick={() => del(doc.id, doc.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
