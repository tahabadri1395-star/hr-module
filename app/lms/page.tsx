"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Course {
  id: number; title: string; description: string | null; category: string;
  content_url: string | null; instructor: string | null; duration_hours: string | null;
  department: string | null; my_status: "not_started" | "in_progress" | "completed";
  started_at: string | null; completed_at: string | null; score: number | null;
}

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  technical:   { label: "Technical",    color: "#1D4ED8", bg: "#EFF6FF" },
  soft_skills: { label: "Soft Skills",  color: "#7C3AED", bg: "#EDE9FE" },
  compliance:  { label: "Compliance",   color: "#DC2626", bg: "#FEF2F2" },
  leadership:  { label: "Leadership",   color: "#B45309", bg: "#FFFBEB" },
  safety:      { label: "Safety",       color: "#059669", bg: "#ECFDF5" },
  other:       { label: "Other",        color: "#475569", bg: "#F8FAFC" },
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: "#94A3B8", bg: "#F8FAFC" },
  in_progress: { label: "In Progress", color: "#2563EB", bg: "#EFF6FF" },
  completed:   { label: "Completed",   color: "#16A34A", bg: "#F0FDF4" },
};

const CATS = ["technical", "soft_skills", "compliance", "leadership", "safety", "other"];

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function LMSPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed" | "not_started">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/lms");
    if (res.ok) { const d = await res.json(); setCourses(d.courses); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(courseId: number, status: string) {
    setSaving(courseId);
    await fetch(`/api/lms/${courseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(null);
    load();
  }

  const filtered = courses.filter(c => {
    if (filter !== "all" && c.my_status !== filter) return false;
    if (catFilter !== "all" && c.category !== catFilter) return false;
    return true;
  });

  const stats = {
    total:       courses.length,
    completed:   courses.filter(c => c.my_status === "completed").length,
    in_progress: courses.filter(c => c.my_status === "in_progress").length,
    not_started: courses.filter(c => c.my_status === "not_started").length,
  };
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70">← Dashboard</Link>
      </nav>

      {/* Hero stats */}
      <div className="px-4 py-6" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-1">Learning & Development</h1>
          <p className="text-sm text-white/70 mb-4">Your training and course progress</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",       value: stats.total,       color: "white" },
              { label: "Completed",   value: stats.completed,   color: "#4ADE80" },
              { label: "In Progress", value: stats.in_progress, color: "#93C5FD" },
              { label: "Completion",  value: `${completionPct}%`, color: "#FBBF24" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
          {stats.total > 0 && (
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, backgroundColor: "#4ADE80" }}></div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Status filter */}
        <div className="flex gap-1 mb-3 p-1 rounded-xl bg-white shadow-sm" style={{ boxShadow: "var(--shadow-sm)" }}>
          {([["all", "All"], ["not_started", "Not Started"], ["in_progress", "In Progress"], ["completed", "Completed"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-xs py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? "#4F46E5" : "transparent", color: filter === f ? "white" : "#64748B" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {["all", ...CATS].map(c => {
            const meta = CAT[c];
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                className="text-xs font-medium px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: catFilter === c ? (c === "all" ? "#4F46E5" : meta.bg) : "white",
                  color: catFilter === c ? (c === "all" ? "white" : meta.color) : "#64748B",
                  borderColor: catFilter === c ? (c === "all" ? "#4F46E5" : meta.color) : "#E2E8F0",
                }}>
                {c === "all" ? "All Categories" : meta.label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No courses found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Check back when new courses are added</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(course => {
              const cat = CAT[course.category] || CAT.other;
              const st  = STATUS[course.my_status];
              const isLoading = saving === course.id;
              return (
                <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  style={{ border: `1px solid ${course.my_status === "completed" ? "#BBF7D0" : "#E2E8F0"}` }}>
                  {/* Completion indicator strip */}
                  {course.my_status === "completed" && (
                    <div className="h-1 w-full" style={{ backgroundColor: "#22C55E" }}></div>
                  )}
                  {course.my_status === "in_progress" && (
                    <div className="h-1 w-1/2" style={{ backgroundColor: "#3B82F6" }}></div>
                  )}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: "#1E293B" }}>{course.title}</h3>
                        {course.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>{course.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs mb-3" style={{ color: "#94A3B8" }}>
                      {course.instructor && <span>By {course.instructor}</span>}
                      {course.duration_hours && <span>{course.duration_hours}h</span>}
                      {course.completed_at && <span>Completed {fmt(course.completed_at)}</span>}
                      {course.started_at && !course.completed_at && <span>Started {fmt(course.started_at)}</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {course.content_url && (
                        <a href={course.content_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                          Open Course
                        </a>
                      )}
                      {course.my_status === "not_started" && (
                        <button onClick={() => updateStatus(course.id, "in_progress")} disabled={isLoading}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#93C5FD", color: "#1D4ED8", backgroundColor: "#EFF6FF", opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? "…" : "Start Course"}
                        </button>
                      )}
                      {course.my_status === "in_progress" && (
                        <button onClick={() => updateStatus(course.id, "completed")} disabled={isLoading}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? "…" : "Mark Complete"}
                        </button>
                      )}
                      {course.my_status === "completed" && (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                          Completed
                        </span>
                      )}
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
