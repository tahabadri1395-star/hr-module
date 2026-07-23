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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: "-120px", left: "-120px", width: "420px", height: "420px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(15,23,42,0.06), transparent 70%)",
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        bottom: "-140px", right: "-140px", width: "460px", height: "460px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(51,65,85,0.06), transparent 70%)",
      }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", boxShadow: "0 8px 24px rgba(15,23,42,0.28)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#1E293B" }}>Admin / HR Login</h1>
          <p className="text-sm mt-1.5" style={{ color: "#64748B" }}>Access the HR management dashboard</p>
        </div>

        <div className="bg-white p-8 animate-in animate-in-delay-1" style={{ borderRadius: "var(--radius-xl)", border: "1px solid #EEF0F4", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748B" }}>USERNAME</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => { e.target.style.borderColor = "#1E293B"; e.target.style.boxShadow = "0 0 0 3.5px rgba(15,23,42,0.10)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748B" }}>PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => { e.target.style.borderColor = "#1E293B"; e.target.style.boxShadow = "0 0 0 3.5px rgba(15,23,42,0.10)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
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
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #0F172A, #334155)",
                opacity: loading ? 0.75 : 1,
                boxShadow: loading ? "none" : "0 4px 14px rgba(15,23,42,0.28)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 animate-in animate-in-delay-2" style={{ color: "#94A3B8" }}>
          Khidmat Guzar?{" "}
          <Link href="/login" className="font-medium" style={{ color: "#4F46E5" }}>
            Khidmat Guzar Login →
          </Link>
        </p>

      </div>
    </div>
  );
}
