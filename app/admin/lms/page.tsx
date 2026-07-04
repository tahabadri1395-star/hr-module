"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Course {
  id: number; title: string; description: string | null; category: string;
  content_url: string | null; instructor: string | null; duration_hours: string | null;
  department: string | null; status: "active" | "archived"; created_by: string; created_at: string;
  completed_count: string; in_progress_count: string; enrolled_count: string; total_kgs: string;
}

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  technical:   { label: "Technical",   color: "#1D4ED8", bg: "#EFF6FF" },
  soft_skills: { label: "Soft Skills", color: "#7C3AED", bg: "#EDE9FE" },
  compliance:  { label: "Compliance",  color: "#DC2626", bg: "#FEF2F2" },
  leadership:  { label: "Leadership",  color: "#B45309", bg: "#FFFBEB" },
  safety:      { label: "Safety",      color: "#059669", bg: "#ECFDF5" },
  other:       { label: "Other",       color: "#475569", bg: "#F8FAFC" },
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Learning & Development</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Manage courses and track KG completion</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditCourse(null); setForm({ title: "", description: "", category: "technical", content_url: "", instructor: "", duration_hours: "", department: "" }); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + Add Course
          </button>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}>
            <span className="text-white font-semibold">{totalActive}</span> active courses
          </div>
          {Object.entries(CAT).map(([c, meta]) => {
            const count = courses.filter(x => x.category === c && x.status === "active").length;
            if (!count) return null;
            return (
              <div key={c} className="px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}>
                <span style={{ color: meta.color }}>{meta.label}</span> · {count}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-5xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Course Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>{editCourse ? "Edit Course" : "Add Course"}</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Excel for HR Professionals"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                  <option value="technical">Technical</option>
                  <option value="soft_skills">Soft Skills</option>
                  <option value="compliance">Compliance</option>
                  <option value="leadership">Leadership</option>
                  <option value="safety">Safety</option>
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
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Instructor</label>
                <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Duration (hours)</label>
                <input value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} type="number" min="0" step="0.5" placeholder="e.g. 2.5"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Content Link <span style={{ color: "#94A3B8" }}>(YouTube, Coursera, Drive, etc.)</span></label>
                <input value={form.content_url} onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))} placeholder="https://…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What will KGs learn?"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none resize-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="text-sm font-semibold px-5 py-2 rounded-xl text-black" style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editCourse ? "Save Changes" : "Add Course"}
              </button>
              <button onClick={() => { setShowForm(false); setEditCourse(null); }} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          {(["active", "archived"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: tab === t ? "#0F172A" : "transparent", color: tab === t ? "white" : "#64748B" }}>
              {t === "active" ? `Active (${courses.filter(c => c.status === "active").length})` : `Archived (${courses.filter(c => c.status === "archived").length})`}
            </button>
          ))}
        </div>

        {/* Course cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No {tab} courses</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Add a course using the button above</p>
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
                <div key={course.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : course.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                        {course.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{course.department}</span>}
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{course.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                        {course.instructor ? `${course.instructor} · ` : ""}{course.duration_hours ? `${course.duration_hours}h · ` : ""}{fmt(course.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: completionPct >= 80 ? "#16A34A" : completionPct >= 40 ? "#B45309" : "#DC2626" }}>{completionPct}%</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{completed}/{totalKGs} done</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 ml-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pb-3 -mt-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                      <div className="h-full rounded-full" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 80 ? "#16A34A" : "#F59E0B" }}></div>
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs" style={{ color: "#16A34A" }}>{completed} completed</span>
                      <span className="text-xs" style={{ color: "#2563EB" }}>{inProgress} in progress</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{totalKGs - enrolled} not started</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 border-t" style={{ borderColor: "#F8FAFC" }}>
                      {course.description && <p className="text-sm mt-3 mb-3" style={{ color: "#64748B" }}>{course.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {course.content_url && (
                          <a href={course.content_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: "#F59E0B" }}>
                            Open Content
                          </a>
                        )}
                        <button onClick={() => openEdit(course)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#475569" }}>Edit</button>
                        <button onClick={() => toggleArchive(course)}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#E2E8F0", color: course.status === "active" ? "#64748B" : "#16A34A" }}>
                          {course.status === "active" ? "Archive" : "Restore"}
                        </button>
                        <button onClick={() => del(course.id, course.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#FECACA", color: "#DC2626", backgroundColor: "#FEF2F2" }}>Delete</button>
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
