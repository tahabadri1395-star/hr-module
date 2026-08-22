"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminPageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard } from "@/lib/desktop-theme";

interface Employee { id: number; name: string; department: string | null; employee_code: string | null; }
interface Task {
  id: number; title: string; description: string | null; assigned_to: number;
  employee_name: string; department: string | null; employee_code: string | null;
  assigned_by: string; priority: "low" | "medium" | "high"; status: "pending" | "ongoing" | "completed";
  due_date: string | null; created_at: string; completed_at: string | null;
}

const PRIORITY_META = {
  high:   { label: "High",   bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
  medium: { label: "Medium", bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  low:    { label: "Low",    bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
};
const STATUS_META = {
  pending:   { label: "Pending",   bg: "rgba(217,180,108,0.15)", color: "#D9B46C" },
  ongoing:   { label: "Ongoing",   bg: "rgba(96,165,250,0.15)", color: "#93C5FD" },
  completed: { label: "Completed", bg: "rgba(74,222,128,0.15)", color: "#4ADE80" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterEmployee !== "all") params.set("assigned_to", filterEmployee);
    const res = await fetch(`/api/admin/tasks?${params}`);
    if (res.ok) { const data = await res.json(); setTasks(data.tasks); }
  }, [filterStatus, filterEmployee]);

  useEffect(() => {
    fetch("/api/admin/employees").then(r => r.json()).then(d => setEmployees(d.employees ?? []));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function openCreate() { setEditTask(null); setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" }); setShowForm(true); setMsg(""); }
  function openEdit(t: Task) { setEditTask(t); setForm({ title: t.title, description: t.description ?? "", assigned_to: String(t.assigned_to), priority: t.priority, due_date: t.due_date ?? "" }); setShowForm(true); setMsg(""); }

  async function handleSave() {
    if (!form.title.trim() || !form.assigned_to) { setMsg("Title and assignee are required."); return; }
    setSaving(true); setMsg("");
    if (editTask) {
      const res = await fetch(`/api/admin/tasks/${editTask.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setSaving(false);
      if (res.ok) { setShowForm(false); loadTasks(); } else setMsg("Failed to save.");
    } else {
      const res = await fetch("/api/admin/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setSaving(false);
      if (res.ok) { setShowForm(false); loadTasks(); } else setMsg("Failed to save.");
    }
  }

  async function handleStatusChange(task: Task, status: string) {
    await fetch(`/api/admin/tasks/${task.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    loadTasks();
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await fetch(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
    loadTasks();
  }

  const pending   = tasks.filter(t => t.status === "pending").length;
  const ongoing   = tasks.filter(t => t.status === "ongoing").length;
  const completed = tasks.filter(t => t.status === "completed").length;

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input";
  const iStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: adminPageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative"
        style={{ backgroundColor: "rgba(11,14,23,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center p-1.5" style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <img src="/estate-mark-white.png" alt="Estate Department" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: ink }}>Task Management</h1>
            <p className="text-sm mt-1" style={{ color: muted }}>Assign and track tasks for Khidmat Guzars</p>
          </div>
          <button onClick={openCreate}
            className="text-sm font-medium px-5 py-2.5 rounded-lg"
            style={{ backgroundColor: gold, color: "#1B1630" }}>
            + New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending",   value: pending,   color: "#D9B46C" },
            { label: "Ongoing",   value: ongoing,   color: "#93C5FD" },
            { label: "Completed", value: completed, color: "#4ADE80" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-5 py-4 cursor-pointer transition"
              style={{ ...glassCard, border: filterStatus === s.label.toLowerCase() ? `1px solid ${s.color}` : glassCard.border }}
              onClick={() => setFilterStatus(filterStatus === s.label.toLowerCase() ? "all" : s.label.toLowerCase())}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none glass-input" style={iStyle}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none glass-input" style={iStyle}>
            <option value="all">All Khidmat Guzars</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="rounded-xl p-6 mb-5" style={{ ...glassCard, border: `1px solid rgba(217,180,108,0.4)` }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: ink }}>{editTask ? "Edit Task" : "New Task"}</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{msg}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title…" className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Task details…"
                  className={inputClass + " resize-none"} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Assign To *</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="">Select Khidmat Guzar…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className={inputClass} style={iStyle}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className={inputClass} style={iStyle}
                  onFocus={e => (e.target.style.borderColor = gold)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="text-sm font-medium px-5 py-2 rounded-lg"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editTask ? "Save Changes" : "Create Task"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="rounded-xl overflow-hidden" style={glassCard}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <h2 className="text-sm font-semibold" style={{ color: ink }}>Tasks</h2>
            <span className="text-xs" style={{ color: muted }}>{tasks.length} total</span>
          </div>
          {tasks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: ink }}>No tasks found</p>
              <p className="text-xs" style={{ color: mutedFaint }}>Create a task to get started</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {tasks.map(task => {
                const pm = PRIORITY_META[task.priority];
                const sm = STATUS_META[task.status];
                const isOverdue = task.due_date && task.status !== "completed" && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: pm.bg, color: pm.color }}>{pm.label}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                          {isOverdue && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>Overdue</span>}
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: task.status === "completed" ? mutedFaint : ink,
                          textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                          {task.title}
                        </p>
                        {task.description && <p className="text-xs mt-1" style={{ color: muted }}>{task.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs" style={{ color: mutedFaint }}>
                            Assigned to: <span className="font-medium" style={{ color: gold }}>{task.employee_name}</span>
                            {task.department ? ` · ${task.department}` : ""}
                          </span>
                          {task.due_date && (
                            <span className="text-xs" style={{ color: isOverdue ? "#F87171" : mutedFaint }}>
                              Due: {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {task.status !== "completed" && (
                          <select value={task.status}
                            onChange={e => handleStatusChange(task, e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg border outline-none glass-input" style={{ borderColor: "rgba(255,255,255,0.14)", color: muted, backgroundColor: "rgba(255,255,255,0.05)" }}>
                            <option value="pending">Pending</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                        <button onClick={() => openEdit(task)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Edit</button>
                        <button onClick={() => handleDelete(task)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(248,113,113,0.35)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>Delete</button>
                      </div>
                    </div>
                    {task.status === "completed" && task.completed_at && (
                      <p className="text-xs mt-1" style={{ color: mutedFaint }}>Completed {formatDate(task.completed_at)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
