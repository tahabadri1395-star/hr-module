"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ its_number: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Ambient background accents */}
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: "-120px", right: "-120px", width: "420px", height: "420px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(124,58,237,0.10), transparent 70%)",
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        bottom: "-140px", left: "-140px", width: "460px", height: "460px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(79,70,229,0.08), transparent 70%)",
      }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "var(--shadow-glow)" }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M7 9H3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M9 13h6M9 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#1E293B" }}>Khidmat Guzar Portal</h1>
          <p className="text-sm mt-1.5" style={{ color: "#64748B" }}>Sign in to access your HR portal</p>
        </div>

        <div className="bg-white p-8 animate-in animate-in-delay-1"
          style={{ borderRadius: "var(--radius-xl)", border: "1px solid #EEF0F4", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748B" }}>
                ITS NUMBER
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.its_number}
                onChange={e => setForm({ ...form, its_number: e.target.value })}
                placeholder="e.g. 30303943"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => { e.target.style.borderColor = "#4F46E5"; e.target.style.boxShadow = "0 0 0 3.5px rgba(79,70,229,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748B" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => { e.target.style.borderColor = "#4F46E5"; e.target.style.boxShadow = "0 0 0 3.5px rgba(79,70,229,0.12)"; }}
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
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                opacity: loading ? 0.75 : 1,
                boxShadow: loading ? "none" : "0 4px 14px rgba(79,70,229,0.28)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 animate-in animate-in-delay-2" style={{ color: "#94A3B8" }}>
          Admin or HR?{" "}
          <Link href="/admin/login" className="font-medium" style={{ color: "#4F46E5" }}>
            Admin Login →
          </Link>
        </p>

      </div>
    </div>
  );
}
