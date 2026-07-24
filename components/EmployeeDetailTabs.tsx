"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "profile",     label: "Profile" },
  { key: "leaves",      label: "Leaves" },
  { key: "attendance",  label: "Attendance" },
  { key: "travel",      label: "Travel & Expenses" },
  { key: "tasks",       label: "Tasks" },
  { key: "murasalat",   label: "Murasalat" },
  { key: "arz",         label: "Arz" },
  { key: "assets",      label: "Assets" },
];

export default function EmployeeDetailTabs({ empId }: { empId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: "#F1F5F9" }}>
      {TABS.map(t => {
        const href = `/admin/employees/${empId}/${t.key}`;
        const active = pathname === href;
        return (
          <Link key={t.key} href={href}
            className="text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
            style={{
              backgroundColor: active ? "white" : "transparent",
              color: active ? "#1E293B" : "#64748B",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
