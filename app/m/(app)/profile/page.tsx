"use client";

import { useState, useEffect } from "react";

interface ProfileData {
  employee: { id: number; name: string; email: string; department: string | null; employee_code: string | null } | null;
  profile: {
    phone: string | null; whatsapp: string | null; address: string | null; city: string | null;
    date_of_birth: string | null; waris_name: string | null; waris_contact: string | null; waris_relation: string | null;
  } | null;
  education: { id: number; degree: string | null; field: string | null; institution: string; year_from: string | null; year_to: string | null }[];
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
      <span className="text-xs" style={{ color: "#94A3B8" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "#1E293B" }}>{value || "—"}</span>
    </div>
  );
}

export default function MobileProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/profile/info").then(res => res.json()).then(setData);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/m/login";
  }

  if (!data) return <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />;

  const { employee, profile, education } = data;

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-2xl bg-white p-5 flex items-center gap-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
          {employee?.name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold" style={{ color: "#1E293B" }}>{employee?.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{employee?.email}</p>
          <div className="flex gap-1.5 mt-1.5">
            {employee?.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{employee.department}</span>}
            {employee?.employee_code && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{employee.employee_code}</span>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-1.5" style={{ color: "#1E293B" }}>Contact Details</h2>
        <Row label="Phone" value={profile?.phone} />
        <Row label="WhatsApp" value={profile?.whatsapp} />
        <Row label="Address" value={profile?.address} />
        <Row label="City" value={profile?.city} />
        <Row label="Date of Birth" value={profile?.date_of_birth} />
      </div>

      <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        <h2 className="text-sm font-semibold mb-1.5" style={{ color: "#1E293B" }}>Waris (Emergency Contact)</h2>
        <Row label="Name" value={profile?.waris_name} />
        <Row label="Relation" value={profile?.waris_relation} />
        <Row label="Contact" value={profile?.waris_contact} />
      </div>

      {education && education.length > 0 && (
        <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-1.5" style={{ color: "#1E293B" }}>Education</h2>
          {education.map(e => (
            <div key={e.id} className="py-2 border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
              <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{e.institution}{e.year_from ? ` · ${e.year_from}${e.year_to ? `–${e.year_to}` : ""}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={logout} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
        Sign Out
      </button>
    </div>
  );
}
