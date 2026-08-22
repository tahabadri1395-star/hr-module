"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Course {
  id: number; title: string; description: string | null; category: string;
  content_url: string | null; instructor: string | null; duration_hours: string | null;
  department: string | null; my_status: "not_started" | "in_progress" | "completed";
  started_at: string | null; completed_at: string | null; score: number | null;
}

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  technical:   { label: "Technical",    color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
  soft_skills: { label: "Soft Skills",  color: "#A78BFA", bg: "rgba(167,139,250,0.15)" },
  compliance:  { label: "Compliance",   color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  leadership:  { label: "Leadership",   color: gold, bg: "rgba(217,180,108,0.15)" },
  safety:      { label: "Safety",       color: "#34D399", bg: "rgba(52,211,153,0.15)" },
  other:       { label: "Other",        color: muted, bg: "rgba(255,255,255,0.08)" },
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: mutedFaint, bg: "rgba(255,255,255,0.08)" },
  in_progress: { label: "In Progress", color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
  completed:   { label: "Completed",   color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
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
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      {/* Hero stats */}
      <div className="px-4 py-6 relative">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold mb-1" style={{ color: ink }}>Learning & Development</h1>
          <p className="text-sm mb-4" style={{ color: muted }}>Your training and course progress</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",       value: stats.total,       color: ink },
              { label: "Completed",   value: stats.completed,   color: "#4ADE80" },
              { label: "In Progress", value: stats.in_progress, color: "#60A5FA" },
              { label: "Completion",  value: `${completionPct}%`, color: gold },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={glassCard}>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: muted }}>{s.label}</p>
              </div>
            ))}
          </div>
          {stats.total > 0 && (
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, backgroundColor: "#4ADE80" }}></div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 relative">
        {/* Status filter */}
        <div className="flex gap-1 mb-3 p-1 rounded-xl" style={glassPill}>
          {([["all", "All"], ["not_started", "Not Started"], ["in_progress", "In Progress"], ["completed", "Completed"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="flex-1 text-xs py-2 rounded-lg font-medium"
              style={{ backgroundColor: filter === f ? gold : "transparent", color: filter === f ? "#1B1630" : muted }}>
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
                  backgroundColor: catFilter === c ? (c === "all" ? gold : meta.bg) : "transparent",
                  color: catFilter === c ? (c === "all" ? "#1B1630" : meta.color) : muted,
                  borderColor: catFilter === c ? (c === "all" ? gold : meta.color) : "rgba(255,255,255,0.14)",
                }}>
                {c === "all" ? "All Categories" : meta.label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <p className="text-sm font-medium" style={{ color: ink }}>No courses found</p>
            <p className="text-xs mt-1" style={{ color: muted }}>Check back when new courses are added</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(course => {
              const cat = CAT[course.category] || CAT.other;
              const st  = STATUS[course.my_status];
              const isLoading = saving === course.id;
              return (
                <div key={course.id} className="rounded-2xl overflow-hidden"
                  style={{ ...glassCard, border: course.my_status === "completed" ? "1px solid rgba(74,222,128,0.3)" : glassCard.border }}>
                  {/* Completion indicator strip */}
                  {course.my_status === "completed" && (
                    <div className="h-1 w-full" style={{ backgroundColor: "#4ADE80" }}></div>
                  )}
                  {course.my_status === "in_progress" && (
                    <div className="h-1 w-1/2" style={{ backgroundColor: "#60A5FA" }}></div>
                  )}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: ink }}>{course.title}</h3>
                        {course.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: muted }}>{course.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs mb-3" style={{ color: mutedFaint }}>
                      {course.instructor && <span>By {course.instructor}</span>}
                      {course.duration_hours && <span>{course.duration_hours}h</span>}
                      {course.completed_at && <span>Completed {fmt(course.completed_at)}</span>}
                      {course.started_at && !course.completed_at && <span>Started {fmt(course.started_at)}</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {course.content_url && (
                        <a href={course.content_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: gold, color: "#1B1630" }}>
                          Open Course
                        </a>
                      )}
                      {course.my_status === "not_started" && (
                        <button onClick={() => updateStatus(course.id, "in_progress")} disabled={isLoading}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "rgba(96,165,250,0.4)", color: "#60A5FA", backgroundColor: "rgba(96,165,250,0.1)", opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? "…" : "Start Course"}
                        </button>
                      )}
                      {course.my_status === "in_progress" && (
                        <button onClick={() => updateStatus(course.id, "completed")} disabled={isLoading}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)", opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? "…" : "Mark Complete"}
                        </button>
                      )}
                      {course.my_status === "completed" && (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
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
