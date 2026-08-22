"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, gold, glassCard, glassPill } from "@/lib/desktop-theme";

interface Employee { id: number; name: string; email: string; department: string | null; employee_code: string | null; }
interface Profile { phone?: string; whatsapp?: string; address?: string; city?: string; date_of_birth?: string; its_number?: string; personal_email?: string; }
interface Education { id: number; institution: string; degree: string | null; field: string | null; year_from: string | null; year_to: string | null; status: string; }
interface TestResult { id: number; test_name: string; score: string | null; date: string | null; remarks: string | null; }

type Tab = "personal" | "education" | "test-results" | "password";

const TABS: { key: Tab; label: string }[] = [
  { key: "personal",     label: "Personal Info" },
  { key: "education",    label: "Education" },
  { key: "test-results", label: "Test Results" },
  { key: "password",     label: "Change Password" },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-xs mb-0.5" style={{ color: muted }}>{label}</p>
      <p className="text-sm" style={{ color: value ? ink : mutedFaint }}>{value || "—"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("personal");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [education, setEducation] = useState<Education[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile/info");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setEmployee(data.employee);
    setProfile(data.profile ?? {});
    setForm(data.profile ?? {});
    setEducation(data.education ?? []);
    setTestResults(data.test_results ?? []);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/profile/info", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setProfile(form); setEditing(false); setMsg("Saved."); load(); }
    else setMsg("Failed to save.");
  }

  async function changePw(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault(); setPwError(""); setPwSuccess("");
    if (pwForm.new_password !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    if (pwForm.new_password.length < 6) { setPwError("Minimum 6 characters."); return; }
    setPwLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
    });
    setPwLoading(false);
    const data = await res.json();
    if (res.ok) { setPwSuccess("Password updated successfully."); setPwForm({ current_password: "", new_password: "", confirm: "" }); }
    else setPwError(data.error ?? "Failed.");
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none glass-input";
  const inputStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)", color: ink };

  return (
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />

      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 relative">
        {/* Header card */}
        {employee && (
          <div className="p-6 mb-6 flex items-center gap-5 animate-in" style={glassCard}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold" style={{ color: ink }}>{employee.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: muted }}>{employee.email}</p>
              <div className="flex gap-3 mt-1">
                {employee.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ ...glassPill, color: "#A78BFA" }}>{employee.department}</span>}
                {employee.employee_code && <span className="text-xs px-2 py-0.5 rounded-full" style={{ ...glassPill, color: muted }}>{employee.employee_code}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={glassPill}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditing(false); setMsg(""); }}
              className="text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
              style={{
                backgroundColor: tab === t.key ? "rgba(255,255,255,0.12)" : "transparent",
                color: tab === t.key ? ink : muted,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        {tab === "personal" && (
          <div className="p-6 animate-in animate-in-delay-1" style={glassCard}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: ink }}>Personal Information</h2>
              {!editing ? (
                <button onClick={() => { setEditing(true); setForm(profile); }}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "rgba(255,255,255,0.16)", color: gold }}>
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.16)", color: muted }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving}
                    className="text-xs px-4 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: gold, color: "#1B1630", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {msg && <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>{msg}</p>}

            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["Phone", "phone"], ["WhatsApp", "whatsapp"],
                  ["Address", "address"], ["City", "city"],
                  ["Date of Birth", "date_of_birth"],
                ] as [string, keyof Profile][]).map(([label, key]) => (
                  <div key={key} className={key === "address" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>{label}</label>
                    <input
                      type={key === "date_of_birth" ? "date" : "text"}
                      value={form[key] ?? ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputClass} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = gold)}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Field label="Phone" value={profile.phone} />
                  <Field label="WhatsApp" value={profile.whatsapp} />
                  <Field label="Date of Birth" value={profile.date_of_birth} />
                  <Field label="City" value={profile.city} />
                </div>
                <div>
                  <Field label="Address" value={profile.address} />
                  <Field label="ITS Number" value={profile.its_number} />
                  <Field label="Personal Email" value={profile.personal_email} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education */}
        {tab === "education" && (
          <div className="overflow-hidden" style={glassCard}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold" style={{ color: ink }}>Education History</h2>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Added by admin — contact admin to update</p>
            </div>
            {education.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: muted }}>No education records on file.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {education.map(e => (
                  <div key={e.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: ink }}>{e.institution}</p>
                        {e.degree && <p className="text-xs mt-0.5" style={{ color: muted }}>{e.degree}{e.field ? ` — ${e.field}` : ""}</p>}
                        {(e.year_from || e.year_to) && (
                          <p className="text-xs mt-0.5" style={{ color: mutedFaint }}>
                            {e.year_from ?? "?"} — {e.year_to ?? (e.status === "ongoing" ? "Present" : "?")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: e.status === "ongoing" ? "rgba(96,165,250,0.15)" : "rgba(74,222,128,0.15)", color: e.status === "ongoing" ? "#60A5FA" : "#4ADE80" }}>
                        {e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Test Results */}
        {tab === "test-results" && (
          <div className="overflow-hidden" style={glassCard}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold" style={{ color: ink }}>Test Results</h2>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Added by admin</p>
            </div>
            {testResults.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: muted }}>No test results on file.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Test / Exam", "Score", "Date", "Remarks"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: mutedFaint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < testResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: ink }}>{r.test_name}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "#A78BFA" }}>{r.score ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: muted }}>{r.date ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: mutedFaint }}>{r.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Change Password */}
        {tab === "password" && (
          <div className="p-6" style={glassCard}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: ink }}>Change Password</h2>
            <form onSubmit={changePw} className="space-y-4 max-w-sm">
              {[["Current Password","current_password"],["New Password","new_password"],["Confirm New Password","confirm"]].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: muted }}>{label}</label>
                  <input type="password" value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    required className={inputClass} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")} />
                </div>
              ))}
              {pwError && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#F87171" }}>{pwError}</p>}
              {pwSuccess && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>{pwSuccess}</p>}
              <button type="submit" disabled={pwLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: gold, color: "#1B1630", opacity: pwLoading ? 0.7 : 1 }}>
                {pwLoading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
