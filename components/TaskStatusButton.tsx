"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props { taskId: number; currentStatus: "pending" | "ongoing" | "completed"; }

const OPTIONS = [
  { value: "pending",   label: "Pending",   bg: "#FFFBEB", color: "#B45309" },
  { value: "ongoing",   label: "Ongoing",   bg: "#EFF6FF", color: "#1D4ED8" },
  { value: "completed", label: "Completed", bg: "#F0FDF4", color: "#15803D" },
];

export default function TaskStatusButton({ taskId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function update(next: string) {
    setSaving(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next as typeof status);
    setSaving(false);
    router.refresh();
  }

  const current = OPTIONS.find(o => o.value === status) ?? OPTIONS[0];

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: current.bg, color: current.color }}>
        {current.label}
      </span>
      {status !== "completed" && (
        <select
          value={status}
          onChange={e => update(e.target.value)}
          disabled={saving}
          className="text-xs px-2 py-1 rounded-lg border outline-none"
          style={{ borderColor: "#E2E8F0", color: "#475569", opacity: saving ? 0.6 : 1 }}>
          <option value="pending">Mark Pending</option>
          <option value="ongoing">Mark Ongoing</option>
          <option value="completed">Mark Completed</option>
        </select>
      )}
    </div>
  );
}
