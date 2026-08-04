"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { bg, ink, muted, accentGradient, neuRaised, neuInset } from "@/lib/mobile-theme";

interface ProfileData {
  employee: { id: number; name: string; email: string; department: string | null; employee_code: string | null } | null;
  profile: {
    phone: string | null; whatsapp: string | null; address: string | null; city: string | null;
    date_of_birth: string | null;
  } | null;
  education: { id: number; degree: string | null; field: string | null; institution: string; year_from: string | null; year_to: string | null }[];
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      <span className="text-xs" style={{ color: muted }}>{label}</span>
      <span className="text-sm font-semibold text-right" style={{ color: ink }}>{value || "—"}</span>
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

  if (!data) return <div className="rounded-3xl h-40" style={{ backgroundColor: bg, boxShadow: neuInset }} />;

  const { employee, profile, education } = data;

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-3xl p-5 flex items-center gap-4" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: accentGradient }}>
          {employee?.name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold" style={{ color: ink }}>{employee?.name}</p>
          <p className="text-xs mt-0.5" style={{ color: muted }}>{employee?.email}</p>
          <div className="flex gap-1.5 mt-2">
            {employee?.department && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, boxShadow: neuInset, color: ink }}>{employee.department}</span>}
            {employee?.employee_code && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, boxShadow: neuInset, color: muted }}>{employee.employee_code}</span>}
          </div>
        </div>
      </div>

      <div className="rounded-3xl px-4 py-3.5" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
        <h2 className="text-sm font-bold mb-1" style={{ color: ink }}>Contact Details</h2>
        <div>
          <Row label="Phone" value={profile?.phone} />
          <Row label="WhatsApp" value={profile?.whatsapp} />
          <Row label="Address" value={profile?.address} />
          <Row label="City" value={profile?.city} />
          <Row label="Date of Birth" value={profile?.date_of_birth} />
        </div>
      </div>

      {education && education.length > 0 && (
        <div className="rounded-3xl px-4 py-3.5" style={{ backgroundColor: bg, boxShadow: neuRaised }}>
          <h2 className="text-sm font-bold mb-1" style={{ color: ink }}>Education</h2>
          <div>
            {education.map(e => (
              <div key={e.id} className="py-2.5 border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <p className="text-sm font-semibold" style={{ color: ink }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</p>
                <p className="text-xs mt-0.5" style={{ color: muted }}>{e.institution}{e.year_from ? ` · ${e.year_from}${e.year_to ? `–${e.year_to}` : ""}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={logout}
        className="w-full py-3.5 rounded-2xl text-sm font-bold"
        style={{ backgroundColor: bg, boxShadow: neuRaised, color: "#DC2626" }}
      >
        Sign Out
      </motion.button>
    </div>
  );
}
