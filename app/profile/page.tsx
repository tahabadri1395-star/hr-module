"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Profile {
  name: string;
  email: string;
  department: string | null;
  employee_code: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leave/my-leaves")
      .then(r => { if (r.status === 401) router.push("/login"); return r.json(); })
      .then(data => {
        if (data.error) router.push("/login");
      });

    fetch("/api/profile/me")
      .then(r => r.json())
      .then(data => { if (data.profile) setProfile(data.profile); })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.new_password !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (form.new_password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setSuccess("Password changed successfully.");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <nav className="bg-white border-b px-6 h-14 flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: "#64748B" }}>← Back to Dashboard</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: "#1E293B" }}>My Profile</h1>

        {/* Profile info */}
        {profile && (
          <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                {profile.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "#1E293B" }}>{profile.name}</p>
                <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{profile.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Department", value: profile.department ?? "—" },
                { label: "Employee Code", value: profile.employee_code ?? "—" },
              ].map(f => (
                <div key={f.label} className="p-3 rounded-lg" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{f.label}</p>
                  <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#1E293B" }}>Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Current Password", key: "current_password" },
              { label: "New Password", key: "new_password" },
              { label: "Confirm New Password", key: "confirm" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{f.label}</label>
                <input
                  type="password"
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                />
              </div>
            ))}

            {error && <p className="text-xs px-4 py-3 rounded-lg" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{error}</p>}
            {success && <p className="text-xs px-4 py-3 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
