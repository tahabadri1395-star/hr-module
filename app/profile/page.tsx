"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Employee { id: number; name: string; email: string; department: string | null; employee_code: string | null; }
interface Profile { phone?: string; whatsapp?: string; address?: string; city?: string; date_of_birth?: string; its_number?: string; }
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
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "#F8FAFC" }}>
      <p className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{label}</p>
      <p className="text-sm" style={{ color: value ? "#1E293B" : "#CBD5E1" }}>{value || "—"}</p>
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

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white";
  const inputStyle = { borderColor: "#E2E8F0", color: "#1E293B" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: "#64748B" }}>← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header card */}
        {employee && (
          <div className="bg-white rounded-xl border p-6 mb-6 flex items-center gap-5" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold" style={{ color: "#1E293B" }}>{employee.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{employee.email}</p>
              <div className="flex gap-3 mt-1">
                {employee.department && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>{employee.department}</span>}
                {employee.employee_code && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{employee.employee_code}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: "#F1F5F9" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditing(false); setMsg(""); }}
              className="text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
              style={{
                backgroundColor: tab === t.key ? "white" : "transparent",
                color: tab === t.key ? "#1E293B" : "#64748B",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        {tab === "personal" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Personal Information</h2>
              {!editing ? (
                <button onClick={() => { setEditing(true); setForm(profile); }}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#E2E8F0", color: "#4F46E5" }}>
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving}
                    className="text-xs px-4 py-1.5 rounded-lg text-white font-medium"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {msg && <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>{msg}</p>}

            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["Phone", "phone"], ["WhatsApp", "whatsapp"],
                  ["Address", "address"], ["City", "city"],
                  ["Date of Birth", "date_of_birth"],
                ] as [string, keyof Profile][]).map(([label, key]) => (
                  <div key={key} className={key === "address" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                    <input
                      type={key === "date_of_birth" ? "date" : "text"}
                      value={form[key] ?? ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputClass} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                      onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education */}
        {tab === "education" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Education History</h2>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Added by admin — contact admin to update</p>
            </div>
            {education.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No education records on file.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                {education.map(e => (
                  <div key={e.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{e.institution}</p>
                        {e.degree && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{e.degree}{e.field ? ` — ${e.field}` : ""}</p>}
                        {(e.year_from || e.year_to) && (
                          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                            {e.year_from ?? "?"} — {e.year_to ?? (e.status === "ongoing" ? "Present" : "?")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: e.status === "ongoing" ? "#EEF2FF" : "#F0FDF4", color: e.status === "ongoing" ? "#4338CA" : "#15803D" }}>
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
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Test Results</h2>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Added by admin</p>
            </div>
            {testResults.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>No test results on file.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {["Test / Exam", "Score", "Date", "Remarks"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < testResults.length - 1 ? "1px solid #F8FAFC" : undefined }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "#1E293B" }}>{r.test_name}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "#4338CA" }}>{r.score ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#64748B" }}>{r.date ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#94A3B8" }}>{r.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Change Password */}
        {tab === "password" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: "#1E293B" }}>Change Password</h2>
            <form onSubmit={changePw} className="space-y-4 max-w-sm">
              {[["Current Password","current_password"],["New Password","new_password"],["Confirm New Password","confirm"]].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                  <input type="password" value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    required className={inputClass} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                </div>
              ))}
              {pwError && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{pwError}</p>}
              {pwSuccess && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>{pwSuccess}</p>}
              <button type="submit" disabled={pwLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: pwLoading ? 0.7 : 1 }}>
                {pwLoading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
