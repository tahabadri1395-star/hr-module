"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Course {
  id: number; title: string; description: string | null; category: string;
  content_url: string | null; instructor: string | null; duration_hours: string | null;
  department: string | null; status: "active" | "archived"; created_by: string; created_at: string;
  completed_count: string; in_progress_count: string; enrolled_count: string; total_kgs: string;
}

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  technical:   { label: "Technical",   color: "#93C5FD", bg: "rgba(96,165,250,0.15)" },
  soft_skills: { label: "Soft Skills", color: "#C4B5FD", bg: "rgba(167,139,250,0.15)" },
  compliance:  { label: "Compliance",  color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  leadership:  { label: "Leadership",  color: "#D9B46C", bg: "rgba(217,180,108,0.15)" },
  safety:      { label: "Safety",      color: "#6EE7B7", bg: "rgba(52,211,153,0.15)" },
  other:       { label: "Other",       color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.08)" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminLMSPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [form, setForm] = useState({ title: "", description: "", category: "technical", content_url: "", instructor: "", duration_hours: "", department: "" });

  const load = useCallback(async () => {
    const [cRes, eRes] = await Promise.all([
      fetch("/api/admin/lms"),
      fetch("/api/admin/employees"),
    ]);
    if (cRes.ok) { const d = await cRes.json(); setCourses(d.courses); }
    if (eRes.ok) { const d = await eRes.json(); setDepartments([...new Set((d.employees ?? []).map((e: { department: string | null }) => e.department).filter(Boolean))] as string[]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(c: Course) {
    setEditCourse(c);
    setForm({ title: c.title, description: c.description ?? "", category: c.category, content_url: c.content_url ?? "", instructor: c.instructor ?? "", duration_hours: c.duration_hours ?? "", department: c.department ?? "" });
    setShowForm(true); setMsg("");
  }

  async function save() {
    if (!form.title.trim()) { setMsg("Title is required."); return; }
    setSaving(true); setMsg("");
    const payload = { ...form, department: form.department || null, content_url: form.content_url || null, instructor: form.instructor || null, duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null, description: form.description || null };
    if (editCourse) {
      await fetch(`/api/admin/lms/${editCourse.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      const res = await fetch("/api/admin/lms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setSaving(false); setMsg(d.error || "Failed."); return; }
    }
    setSaving(false);
    setShowForm(false); setEditCourse(null); setForm({ title: "", description: "", category: "technical", content_url: "", instructor: "", duration_hours: "", department: "" });
    load();
  }

  async function toggleArchive(c: Course) {
    await fetch(`/api/admin/lms/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: c.status === "active" ? "archive" : "restore" }) });
    load();
  }

  async function del(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/lms/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = courses.filter(c => c.status === tab);
  const totalKGs = parseInt(courses[0]?.total_kgs ?? "0", 10);
  const totalActive = courses.filter(c => c.status === "active").length;
  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.06)", color: ink };

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

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Learning & Development</h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>Manage courses and track KG completion</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditCourse(null); setForm({ title: "", description: "", category: "technical", content_url: "", instructor: "", duration_hours: "", department: "" }); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + Add Course
          </button>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 flex-wrap mb-6">
          <div className="px-3 py-1.5 rounded-xl text-xs" style={glassPill}>
            <span style={{ color: ink }} className="font-semibold">{totalActive}</span> <span style={{ color: muted }}>active courses</span>
          </div>
          {Object.entries(CAT).map(([c, meta]) => {
            const count = courses.filter(x => x.category === c && x.status === "active").length;
            if (!count) return null;
            return (
              <div key={c} className="px-3 py-1.5 rounded-xl text-xs" style={glassPill}>
                <span style={{ color: meta.color }}>{meta.label}</span> · <span style={{ color: muted }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Course Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-5" style={{ ...glassCard, border: "1px solid rgba(217,180,108,0.4)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: ink }}>{editCourse ? "Edit Course" : "Add Course"}</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Excel for HR Professionals"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                  <option value="technical">Technical</option>
                  <option value="soft_skills">Soft Skills</option>
                  <option value="compliance">Compliance</option>
                  <option value="leadership">Leadership</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Department (blank = all)</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}>
                  <option value="">All Khidmat Guzars</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Instructor</label>
                <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Duration (hours)</label>
                <input value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} type="number" min="0" step="0.5" placeholder="e.g. 2.5"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none glass-input" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Content Link <span style={{ color: mutedFaint }}>(YouTube, Coursera, Drive, etc.)</span></label>
                <input value={form.content_url} onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))} placeholder="https://…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono glass-input" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What will KGs learn?"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none glass-input" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="text-sm font-semibold px-5 py-2 rounded-xl" style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editCourse ? "Save Changes" : "Add Course"}
              </button>
              <button onClick={() => { setShowForm(false); setEditCourse(null); }} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={glassPill}>
          {(["active", "archived"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: tab === t ? gold : "transparent", color: tab === t ? "#1B1630" : muted }}>
              {t === "active" ? `Active (${courses.filter(c => c.status === "active").length})` : `Archived (${courses.filter(c => c.status === "archived").length})`}
            </button>
          ))}
        </div>

        {/* Course cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No {tab} courses</p>
            <p className="text-xs mt-1" style={{ color: mutedFaint }}>Add a course using the button above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(course => {
              const cat = CAT[course.category] || CAT.other;
              const completed   = parseInt(course.completed_count, 10);
              const inProgress  = parseInt(course.in_progress_count, 10);
              const enrolled    = parseInt(course.enrolled_count, 10);
              const completionPct = totalKGs > 0 ? Math.round((completed / totalKGs) * 100) : 0;
              const isOpen = expanded === course.id;

              return (
                <div key={course.id} className="rounded-2xl overflow-hidden" style={glassCard}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : course.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                        {course.department && <span className="text-xs px-2 py-0.5 rounded-full" style={glassPill}>{course.department}</span>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: ink }}>{course.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>
                        {course.instructor ? `${course.instructor} · ` : ""}{course.duration_hours ? `${course.duration_hours}h · ` : ""}{fmt(course.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: completionPct >= 80 ? "#4ADE80" : completionPct >= 40 ? "#D9B46C" : "#F87171" }}>{completionPct}%</p>
                      <p className="text-xs" style={{ color: mutedFaint }}>{completed}/{totalKGs} done</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 ml-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: mutedFaint }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pb-3 -mt-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 80 ? "#4ADE80" : gold }}></div>
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs" style={{ color: "#4ADE80" }}>{completed} completed</span>
                      <span className="text-xs" style={{ color: "#93C5FD" }}>{inProgress} in progress</span>
                      <span className="text-xs" style={{ color: mutedFaint }}>{totalKGs - enrolled} not started</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      {course.description && <p className="text-sm mt-3 mb-3" style={{ color: muted }}>{course.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {course.content_url && (
                          <a href={course.content_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: gold, color: "#1B1630" }}>
                            Open Content
                          </a>
                        )}
                        <button onClick={() => openEdit(course)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Edit</button>
                        <button onClick={() => toggleArchive(course)}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "rgba(255,255,255,0.16)", color: course.status === "active" ? muted : "#4ADE80" }}>
                          {course.status === "active" ? "Archive" : "Restore"}
                        </button>
                        <button onClick={() => del(course.id, course.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>Delete</button>
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
