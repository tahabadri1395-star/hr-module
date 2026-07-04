"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Doc {
  id: number; title: string; description: string | null; category: string;
  file_url: string; department: string | null; created_by: string; created_at: string;
}

const CAT_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  policy:      { label: "Policy",      color: "#1D4ED8", bg: "#EFF6FF", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  form:        { label: "Form",        color: "#7C3AED", bg: "#EDE9FE", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  certificate: { label: "Certificate", color: "#B45309", bg: "#FFFBEB", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  circular:    { label: "Circular",    color: "#0891B2", bg: "#ECFEFF", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  sop:         { label: "SOP",         color: "#059669", bg: "#ECFDF5", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  other:       { label: "Other",       color: "#475569", bg: "#F8FAFC", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
};

const CATEGORIES = ["policy", "form", "certificate", "circular", "sop", "other"];

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) { const d = await res.json(); setDocs(d.documents); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter(d => {
    if (catFilter !== "all" && d.category !== catFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !(d.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = catFilter === "all"
    ? CATEGORIES.reduce<Record<string, Doc[]>>((acc, c) => {
        const items = filtered.filter(d => d.category === c);
        if (items.length) acc[c] = items;
        return acc;
      }, {})
    : { [catFilter]: filtered };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Document Vault</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Policies, forms, certificates and official documents</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            onFocus={e => (e.target.style.borderColor = "#4F46E5")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["all", ...CATEGORIES].map(c => {
            const meta = CAT_META[c];
            const count = c === "all" ? docs.length : docs.filter(d => d.category === c).length;
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition"
                style={{
                  backgroundColor: catFilter === c ? (c === "all" ? "#4F46E5" : meta.bg) : "white",
                  color: catFilter === c ? (c === "all" ? "white" : meta.color) : "#64748B",
                  borderColor: catFilter === c ? (c === "all" ? "#4F46E5" : meta.color) : "#E2E8F0",
                }}>
                {c === "all" ? `All (${count})` : `${meta.label} (${count})`}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl py-12 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm" style={{ color: "#94A3B8" }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No documents found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => {
              const meta = CAT_META[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.bg }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d={meta.icon} stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>· {items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="block bg-white rounded-2xl px-5 py-4 transition hover:shadow-md"
                        style={{ border: "1px solid #E2E8F0" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{doc.title}</p>
                            {doc.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>{doc.description}</p>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-xs" style={{ color: "#94A3B8" }}>{fmt(doc.created_at)}</p>
                              {doc.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{doc.department}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.bg }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </a>
                    ))}
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
