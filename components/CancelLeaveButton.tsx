"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelLeaveButton({ leaveId }: { leaveId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave/${leaveId}/cancel`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs" style={{ color: "#64748B" }}>Cancel this application?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
          style={{ backgroundColor: "#DC2626", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Cancelling…" : "Yes, Cancel"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium border"
          style={{ borderColor: "#E2E8F0", color: "#64748B" }}
        >
          Keep It
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-3 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:opacity-70"
      style={{ borderColor: "#FECDD3", color: "#DC2626", backgroundColor: "#FFF1F2" }}
    >
      Cancel Application
    </button>
  );
}
