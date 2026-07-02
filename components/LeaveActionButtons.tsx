"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const approveLabel  = role === "super_admin" ? "Final Approve" : "Approve";
  const approveColor  = "#15803D";
  const approveBg     = "#F0FDF4";
  const approveBorder = "#BBF7D0";
  const rejectLabel   = role === "super_admin" ? "Reject" : "Reject";

  return (
    <div className="mt-3">
      {!expanded ? (
        <div className="flex gap-2">
          <button
            onClick={() => doAction("approve")}
            disabled={!!loading}
            className="text-xs font-medium px-4 py-1.5 rounded-lg border transition-colors"
            style={{ backgroundColor: approveBg, color: approveColor, borderColor: approveBorder, opacity: loading ? 0.6 : 1 }}>
            {loading === "approve" ? "…" : approveLabel}
          </button>
          <button
            onClick={() => setExpanded(true)}
            disabled={!!loading}
            className="text-xs font-medium px-4 py-1.5 rounded-lg border transition-colors"
            style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA", opacity: loading ? 0.6 : 1 }}>
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
            className="w-full text-xs px-3 py-2 rounded-lg border outline-none resize-none"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => doAction("approve")}
              disabled={!!loading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ backgroundColor: approveBg, color: approveColor, borderColor: approveBorder, opacity: loading ? 0.6 : 1 }}>
              {loading === "approve" ? "…" : approveLabel}
            </button>
            <button
              onClick={() => doAction("reject")}
              disabled={!!loading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA", opacity: loading ? 0.6 : 1 }}>
              {loading === "reject" ? "…" : "Confirm Reject"}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
