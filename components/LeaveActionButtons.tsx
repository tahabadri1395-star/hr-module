"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutedFaint } from "@/lib/desktop-theme";

interface Props {
  leaveId: number;
  role: "admin" | "super_admin";
}

export default function LeaveActionButtons({ leaveId, role }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [expanded, setExpanded] = useState(false);

  const doAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/leaves/${leaveId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || null }),
      });
      if (res.ok) {
        setNote("");
        setExpanded(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setLoading(null);
    }
  };

  const approveLabel = role === "super_admin" ? "Final Approve" : "Approve";
  const rejectLabel = "Reject";

  const approveStyle = { backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80", borderColor: "rgba(74,222,128,0.3)" };
  const rejectStyle = { backgroundColor: "rgba(248,113,113,0.12)", color: "#F87171", borderColor: "rgba(248,113,113,0.3)" };

  return (
    <div className="mt-3">
      {!expanded ? (
        <div className="flex gap-2">
          <button
            onClick={() => doAction("approve")}
            disabled={!!loading}
            className="text-xs font-medium px-4 py-1.5 rounded-lg border transition-colors"
            style={{ ...approveStyle, opacity: loading ? 0.6 : 1 }}>
            {loading === "approve" ? "…" : approveLabel}
          </button>
          <button
            onClick={() => setExpanded(true)}
            disabled={!!loading}
            className="text-xs font-medium px-4 py-1.5 rounded-lg border transition-colors"
            style={{ ...rejectStyle, opacity: loading ? 0.6 : 1 }}>
            {rejectLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note for employee..."
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-lg border outline-none resize-none glass-input"
            style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: "white" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => doAction("approve")}
              disabled={!!loading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ ...approveStyle, opacity: loading ? 0.6 : 1 }}>
              {loading === "approve" ? "…" : approveLabel}
            </button>
            <button
              onClick={() => doAction("reject")}
              disabled={!!loading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ ...rejectStyle, opacity: loading ? 0.6 : 1 }}>
              {loading === "reject" ? "…" : "Confirm Reject"}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "rgba(255,255,255,0.16)", color: mutedFaint }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
