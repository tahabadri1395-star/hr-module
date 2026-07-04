"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Option { id: number; option_text: string; vote_count: number; display_order: number; }
interface Poll {
  id: number; title: string; description: string | null; status: "active" | "closed";
  created_by: string; created_at: string; total_votes: string; my_vote: number | null;
  options: Option[];
}

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function ResultBar({ option, total, isMyVote }: { option: Option; total: number; isMyVote: boolean }) {
  const pct = total > 0 ? Math.round((option.vote_count / total) * 100) : 0;
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {isMyVote && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4F46E5" }}></div>}
          <span className="text-sm" style={{ color: isMyVote ? "#4338CA" : "#334155", fontWeight: isMyVote ? 600 : 400 }}>{option.option_text}</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: "#64748B" }}>{pct}% · {option.vote_count}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isMyVote ? "#4F46E5" : "#CBD5E1" }}></div>
      </div>
    </div>
  );
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [voting, setVoting] = useState<number | null>(null);
  const [msg, setMsg] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<"active" | "closed">("active");

  const load = useCallback(async () => {
    const res = await fetch("/api/polls");
    if (res.ok) { const d = await res.json(); setPolls(d.polls); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function vote(pollId: number) {
    const optId = selected[pollId];
    if (!optId) { setMsg(m => ({ ...m, [pollId]: "Please select an option." })); return; }
    setVoting(pollId);
    const res = await fetch(`/api/polls/${pollId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_id: optId }),
    });
    setVoting(null);
    if (res.ok) { setMsg(m => ({ ...m, [pollId]: "" })); load(); }
    else { const d = await res.json(); setMsg(m => ({ ...m, [pollId]: d.error || "Failed." })); }
  }

  const filtered = polls.filter(p => p.status === tab);
  const activeCount = polls.filter(p => p.status === "active" && !p.my_vote).length;

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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Polls</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Vote on active polls and view results</p>
          </div>
          {activeCount > 0 && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: "#4F46E5" }}>
              {activeCount} pending
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
          {(["active", "closed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 text-sm py-2 rounded-lg font-medium capitalize"
              style={{ backgroundColor: tab === t ? "#4F46E5" : "transparent", color: tab === t ? "white" : "#64748B" }}>
              {t === "active" ? `Active${polls.filter(p => p.status === "active").length > 0 ? ` (${polls.filter(p => p.status === "active").length})` : ""}` : "Closed"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No {tab} polls</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(poll => {
              const total = parseInt(poll.total_votes, 10);
              const hasVoted = poll.my_vote !== null;
              const canVote = poll.status === "active" && !hasVoted;
              return (
                <div key={poll.id} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>{poll.title}</h2>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: poll.status === "active" ? "#ECFDF5" : "#F8FAFC", color: poll.status === "active" ? "#16A34A" : "#64748B" }}>
                        {poll.status === "active" ? "Active" : "Closed"}
                      </span>
                    </div>
                    {poll.description && <p className="text-sm mb-3" style={{ color: "#64748B" }}>{poll.description}</p>}
                    <p className="text-xs mb-4" style={{ color: "#94A3B8" }}>
                      {fmt(poll.created_at)} · {total} {total === 1 ? "vote" : "votes"}
                    </p>

                    {/* Vote or Results */}
                    {canVote ? (
                      <div>
                        <div className="space-y-2 mb-4">
                          {poll.options.map(opt => (
                            <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                              style={{ border: `2px solid ${selected[poll.id] === opt.id ? "#4F46E5" : "#E2E8F0"}`, backgroundColor: selected[poll.id] === opt.id ? "#EEF2FF" : "white" }}>
                              <input type="radio" name={`poll-${poll.id}`} value={opt.id}
                                checked={selected[poll.id] === opt.id}
                                onChange={() => setSelected(s => ({ ...s, [poll.id]: opt.id }))}
                                className="accent-indigo-600" />
                              <span className="text-sm" style={{ color: "#1E293B" }}>{opt.option_text}</span>
                            </label>
                          ))}
                        </div>
                        {msg[poll.id] && <p className="text-xs mb-2" style={{ color: "#DC2626" }}>{msg[poll.id]}</p>}
                        <button onClick={() => vote(poll.id)} disabled={voting === poll.id}
                          className="text-sm font-semibold px-5 py-2 rounded-xl text-white"
                          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: voting === poll.id ? 0.7 : 1 }}>
                          {voting === poll.id ? "Submitting…" : "Submit Vote"}
                        </button>
                      </div>
                    ) : (
                      <div>
                        {hasVoted && (
                          <p className="text-xs font-medium mb-3" style={{ color: "#4338CA" }}>You voted · Results</p>
                        )}
                        {poll.options.map(opt => (
                          <ResultBar key={opt.id} option={opt} total={total} isMyVote={poll.my_vote === opt.id} />
                        ))}
                      </div>
                    )}
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
