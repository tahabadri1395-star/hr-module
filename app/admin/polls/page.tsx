"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Option { id: number; option_text: string; vote_count: number; display_order: number; }
interface Poll {
  id: number; title: string; description: string | null; status: "active" | "closed";
  created_by: string; created_at: string; total_votes: string; total_kgs: string;
  options: Option[];
}

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [tab, setTab] = useState<"active" | "closed">("active");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/polls");
    if (res.ok) { const d = await res.json(); setPolls(d.polls); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function addOption() { if (options.length < 8) setOptions(o => [...o, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i)); }
  function updateOption(i: number, val: string) { setOptions(o => o.map((v, idx) => idx === i ? val : v)); }

  async function submit() {
    if (!title.trim()) { setMsg("Title is required."); return; }
    const validOpts = options.filter(o => o.trim());
    if (validOpts.length < 2) { setMsg("At least 2 options are required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/polls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, options: validOpts }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false); setTitle(""); setDescription(""); setOptions(["", "", ""]);
      load();
    } else { const d = await res.json(); setMsg(d.error || "Failed."); }
  }

  async function toggleStatus(id: number, current: string) {
    const next = current === "active" ? "closed" : "active";
    await fetch(`/api/admin/polls/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function deletePoll(id: number, t: string) {
    if (!confirm(`Delete poll "${t}"? All votes will be lost.`)) return;
    await fetch(`/api/admin/polls/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = polls.filter(p => p.status === tab);

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
            <h1 className="text-2xl font-bold text-white">Polls</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Create polls and view participation results</p>
          </div>
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ backgroundColor: "#F59E0B" }}>
            + New Poll
          </button>
        </div>
      </div>

      <div className="rounded-t-3xl min-h-screen px-6 py-6 max-w-5xl mx-auto" style={{ backgroundColor: "#F1F5F9" }}>

        {/* Create Poll Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ border: "2px solid #F59E0B" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>New Poll</h2>
            {msg && <p className="mb-3 text-xs" style={{ color: "#DC2626" }}>{msg}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Poll Question *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="What would you like to ask?"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Description (optional)</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Additional context…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Options *</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border outline-none"
                        style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                        onFocus={e => (e.target.style.borderColor = "#F59E0B")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                      {options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 8 && (
                  <button onClick={addOption} className="mt-2 text-xs font-medium" style={{ color: "#4F46E5" }}>+ Add option</button>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-black"
                style={{ backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Creating…" : "Create Poll"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          {(["active", "closed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: tab === t ? "#0F172A" : "transparent", color: tab === t ? "white" : "#64748B" }}>
              {t === "active" ? `Active (${polls.filter(p => p.status === "active").length})` : `Closed (${polls.filter(p => p.status === "closed").length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No {tab} polls</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Create a poll using the button above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(poll => {
              const total = parseInt(poll.total_votes, 10);
              const totalKGs = parseInt(poll.total_kgs, 10);
              const participationPct = totalKGs > 0 ? Math.round((total / totalKGs) * 100) : 0;
              const isOpen = expanded === poll.id;

              return (
                <div key={poll.id} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
                  {/* Header */}
                  <div className="px-5 py-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : poll.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: poll.status === "active" ? "#ECFDF5" : "#F8FAFC", color: poll.status === "active" ? "#16A34A" : "#64748B" }}>
                          {poll.status === "active" ? "Active" : "Closed"}
                        </span>
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{poll.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{fmt(poll.created_at)} · {total} votes · {participationPct}% participation</p>
                    </div>
                    {/* Mini participation indicator */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: participationPct > 50 ? "#15803D" : "#B45309" }}>{participationPct}%</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{total}/{totalKGs}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-1 ml-1"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", color: "#94A3B8" }}>
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Participation bar */}
                  <div className="px-5 pb-3 -mt-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${participationPct}%`, backgroundColor: participationPct > 50 ? "#15803D" : "#F59E0B" }}></div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "#F8FAFC" }}>
                      {poll.description && <p className="text-sm mt-3 mb-4" style={{ color: "#64748B" }}>{poll.description}</p>}

                      {/* Results */}
                      <div className="mt-3 space-y-3">
                        {[...poll.options].sort((a, b) => b.vote_count - a.vote_count).map(opt => {
                          const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
                          const isWinning = opt.vote_count === Math.max(...poll.options.map(o => o.vote_count)) && opt.vote_count > 0;
                          return (
                            <div key={opt.id}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {isWinning && total > 0 && <span className="text-xs font-bold" style={{ color: "#F59E0B" }}>★</span>}
                                  <span className="text-sm font-medium" style={{ color: "#1E293B" }}>{opt.option_text}</span>
                                </div>
                                <span className="text-xs font-bold" style={{ color: "#475569" }}>{pct}% ({opt.vote_count})</span>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: isWinning && total > 0 ? "#F59E0B" : "#CBD5E1" }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 mt-5">
                        <button onClick={() => toggleStatus(poll.id, poll.status)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: poll.status === "active" ? "#FEF2F2" : "#ECFDF5", color: poll.status === "active" ? "#DC2626" : "#16A34A", border: `1px solid ${poll.status === "active" ? "#FECACA" : "#BBF7D0"}` }}>
                          {poll.status === "active" ? "Close Poll" : "Reopen Poll"}
                        </button>
                        <button onClick={() => deletePoll(poll.id, poll.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
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
