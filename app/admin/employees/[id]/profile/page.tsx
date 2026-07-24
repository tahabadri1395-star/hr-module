"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Profile {
  phone?: string; whatsapp?: string; address?: string; city?: string; date_of_birth?: string;
  waris_name?: string; waris_contact?: string; waris_relation?: string;
  its_number?: string; passport_number?: string; passport_expiry?: string;
  aadhar_number?: string; pan_number?: string;
  bank_name?: string; bank_account?: string; bank_ifsc?: string; bank_branch?: string;
}
interface Education { id: number; institution: string; degree: string | null; field: string | null; year_from: string | null; year_to: string | null; status: string; }
interface TestResult { id: number; test_name: string; score: string | null; date: string | null; remarks: string | null; }

type Tab = "personal" | "documents" | "bank" | "education" | "test-results";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2.5 border-b last:border-b-0" style={{ borderColor: "#F8FAFC" }}>
      <p className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{label}</p>
      <p className="text-sm" style={{ color: value ? "#1E293B" : "#CBD5E1" }}>{value || "—"}</p>
    </div>
  );
}

export default function AdminEmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const empId = params.id;

  const [tab, setTab] = useState<Tab>("personal");
  const [profile, setProfile] = useState<Profile>({});
  const [education, setEducation] = useState<Education[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [form, setForm] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [eduForm, setEduForm] = useState({ institution: "", degree: "", field: "", year_from: "", year_to: "", status: "completed" });
  const [testForm, setTestForm] = useState({ test_name: "", score: "", date: "", remarks: "" });
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingTest, setAddingTest] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/employees/${empId}/profile`);
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data.profile ?? {});
    setForm(data.profile ?? {});
    setEducation(data.education ?? []);
    setTestResults(data.test_results ?? []);
  }, [empId]);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/employees/${empId}/profile`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setProfile(form); setEditSection(null); setMsg("Saved."); }
    else setMsg("Failed.");
  }

  async function addEducation() {
    if (!eduForm.institution.trim()) return;
    const res = await fetch(`/api/admin/employees/${empId}/education`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eduForm),
    });
    if (res.ok) { setAddingEdu(false); setEduForm({ institution: "", degree: "", field: "", year_from: "", year_to: "", status: "completed" }); load(); }
  }

  async function deleteEducation(eid: number) {
    await fetch(`/api/admin/employees/${empId}/education/${eid}`, { method: "DELETE" });
    load();
  }

  async function addTest() {
    if (!testForm.test_name.trim()) return;
    const res = await fetch(`/api/admin/employees/${empId}/test-results`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(testForm),
    });
    if (res.ok) { setAddingTest(false); setTestForm({ test_name: "", score: "", date: "", remarks: "" }); load(); }
  }

  async function deleteTest(rid: number) {
    await fetch(`/api/admin/employees/${empId}/test-results/${rid}`, { method: "DELETE" });
    load();
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white";
  const iStyle = { borderColor: "#E2E8F0", color: "#1E293B" };
  const TABS: { key: Tab; label: string }[] = [
    { key: "personal", label: "Personal" },
    { key: "documents", label: "Documents & ITS" },
    { key: "bank", label: "Bank Details" },
    { key: "education", label: "Education" },
    { key: "test-results", label: "Test Results" },
  ];

  return (
    <div>
        {/* Sub-tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: "#F1F5F9" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditSection(null); setMsg(""); }}
              className="text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap"
              style={{
                backgroundColor: tab === t.key ? "white" : "transparent",
                color: tab === t.key ? "#1E293B" : "#64748B",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {msg && <p className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>{msg}</p>}

        {/* Personal Tab */}
        {tab === "personal" && (
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Personal Information</h2>
              {editSection !== "personal" ? (
                <button onClick={() => { setEditSection("personal"); setForm(profile); }}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#E2E8F0", color: "#4F46E5" }}>Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditSection(null)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving}
                    className="text-xs px-4 py-1.5 rounded-lg text-white font-medium"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
            {editSection === "personal" ? (
              <div className="grid grid-cols-2 gap-4">
                {([["Phone","phone"],["WhatsApp","whatsapp"],["Date of Birth","date_of_birth"],["City","city"]] as [string,keyof Profile][]).map(([label,key]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                    <input type={key === "date_of_birth" ? "date" : "text"} value={form[key]??""} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                      className={inputClass} style={iStyle}
                      onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Address</label>
                  <input value={form.address??""} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                    className={inputClass} style={iStyle}
                    onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Field label="Phone" value={profile.phone}/>
                  <Field label="WhatsApp" value={profile.whatsapp}/>
                  <Field label="Date of Birth" value={profile.date_of_birth}/>
                  <Field label="City" value={profile.city}/>
                </div>
                <div>
                  <Field label="Address" value={profile.address}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {tab === "documents" && (
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Documents & ITS</h2>
              {editSection !== "docs" ? (
                <button onClick={() => { setEditSection("docs"); setForm(profile); }}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#E2E8F0", color: "#4F46E5" }}>Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditSection(null)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving}
                    className="text-xs px-4 py-1.5 rounded-lg text-white font-medium"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
            {editSection === "docs" ? (
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["ITS Number", "its_number"],
                  ["Passport Number", "passport_number"],
                  ["Passport Expiry", "passport_expiry"],
                  ["Aadhar Number", "aadhar_number"],
                  ["PAN Number", "pan_number"],
                ] as [string, keyof Profile][]).map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                    <input type={key === "passport_expiry" ? "date" : "text"} value={form[key]??""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                      className={inputClass} style={iStyle}
                      onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Field label="ITS Number" value={profile.its_number}/>
                  <Field label="Passport Number" value={profile.passport_number}/>
                  <Field label="Passport Expiry" value={profile.passport_expiry}/>
                </div>
                <div>
                  <Field label="Aadhar Number" value={profile.aadhar_number}/>
                  <Field label="PAN Number" value={profile.pan_number}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bank Tab */}
        {tab === "bank" && (
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Bank Details</h2>
              {editSection !== "bank" ? (
                <button onClick={() => { setEditSection("bank"); setForm(profile); }}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#E2E8F0", color: "#4F46E5" }}>Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditSection(null)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving}
                    className="text-xs px-4 py-1.5 rounded-lg text-white font-medium"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
            {editSection === "bank" ? (
              <div className="grid grid-cols-2 gap-4">
                {([["Bank Name","bank_name"],["Account Number","bank_account"],["IFSC Code","bank_ifsc"],["Branch","bank_branch"]] as [string,keyof Profile][]).map(([label,key])=>(
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                    <input value={form[key]??""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                      className={inputClass} style={iStyle}
                      onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Field label="Bank Name" value={profile.bank_name}/>
                  <Field label="Account Number" value={profile.bank_account}/>
                </div>
                <div>
                  <Field label="IFSC Code" value={profile.bank_ifsc}/>
                  <Field label="Branch" value={profile.bank_branch}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education Tab */}
        {tab === "education" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Education History</h2>
                <button onClick={() => setAddingEdu(true)}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>+ Add</button>
              </div>
              {addingEdu && (
                <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", backgroundColor: "#FAFAFA" }}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {([["Institution*","institution","text"],["Degree","degree","text"],["Field/Subject","field","text"],["Year From","year_from","text"],["Year To","year_to","text"]] as [string,string,string][]).map(([label,key,type])=>(
                      <div key={key}>
                        <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</label>
                        <input type={type} value={eduForm[key as keyof typeof eduForm]} onChange={e=>setEduForm(f=>({...f,[key]:e.target.value}))}
                          className={inputClass} style={iStyle}
                          onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Status</label>
                      <select value={eduForm.status} onChange={e=>setEduForm(f=>({...f,status:e.target.value}))}
                        className={inputClass} style={iStyle}>
                        <option value="completed">Completed</option>
                        <option value="ongoing">Ongoing</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addEducation} className="text-xs px-4 py-1.5 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>Add</button>
                    <button onClick={() => setAddingEdu(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                  </div>
                </div>
              )}
              {education.length === 0 && !addingEdu ? (
                <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No education records.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                  {education.map(e => (
                    <div key={e.id} className="px-6 py-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{e.institution}</p>
                        {e.degree && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{e.degree}{e.field ? ` — ${e.field}` : ""}</p>}
                        {(e.year_from||e.year_to) && <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{e.year_from??""} — {e.year_to||(e.status==="ongoing"?"Present":"")}</p>}
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{ backgroundColor: e.status==="ongoing"?"#EEF2FF":"#F0FDF4", color: e.status==="ongoing"?"#4338CA":"#15803D" }}>
                          {e.status}
                        </span>
                      </div>
                      <button onClick={() => deleteEducation(e.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: "#FECDD3", color: "#DC2626" }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Results Tab */}
        {tab === "test-results" && (
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>Test Results</h2>
              <button onClick={() => setAddingTest(true)}
                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>+ Add</button>
            </div>
            {addingTest && (
              <div className="px-6 py-4 border-b" style={{ borderColor: "#F1F5F9", backgroundColor: "#FAFAFA" }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {([["Test / Exam Name*","test_name"],["Score","score"],["Date","date"],["Remarks","remarks"]] as [string,string][]).map(([label,key])=>(
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</label>
                      <input type={key==="date"?"date":"text"} value={testForm[key as keyof typeof testForm]} onChange={e=>setTestForm(f=>({...f,[key]:e.target.value}))}
                        className={inputClass} style={iStyle}
                        onFocus={e=>(e.target.style.borderColor="#4F46E5")} onBlur={e=>(e.target.style.borderColor="#E2E8F0")}/>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addTest} className="text-xs px-4 py-1.5 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>Add</button>
                  <button onClick={() => setAddingTest(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
                </div>
              </div>
            )}
            {testResults.length === 0 && !addingTest ? (
              <div className="py-10 text-center text-sm" style={{ color: "#94A3B8" }}>No test results.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {["Test / Exam","Score","Date","Remarks",""].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {testResults.map((r,i) => (
                    <tr key={r.id} style={{ borderBottom: i<testResults.length-1?"1px solid #F8FAFC":undefined }}>
                      <td className="px-5 py-3.5 font-medium text-xs" style={{ color: "#1E293B" }}>{r.test_name}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "#4338CA" }}>{r.score??""}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#64748B" }}>{r.date??""}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#94A3B8" }}>{r.remarks??""}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={()=>deleteTest(r.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: "#FECDD3", color: "#DC2626" }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
    </div>
  );
}
