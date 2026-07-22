"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials.");
      // super_admin goes to /admin/super, admin goes to /admin
      window.location.href = data.role === "super_admin" ? "/admin/super" : "/admin";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Admin / HR Login</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Access the HR management dashboard</p>
        </div>

        <div className="bg-white rounded-xl border p-8" style={{ borderColor: "#E2E8F0" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => (e.target.style.borderColor = "#1E293B")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => (e.target.style.borderColor = "#1E293B")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
              style={{ background: "linear-gradient(135deg, #0F172A, #334155)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#94A3B8" }}>
          Khidmat Guzar?{" "}
          <Link href="/login" className="font-medium" style={{ color: "#4F46E5" }}>
            Khidmat Guzar Login →
          </Link>
        </p>

      </div>
    </div>
  );
}
