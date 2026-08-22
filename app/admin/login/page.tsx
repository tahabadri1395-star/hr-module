"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const ARCH_PATTERN = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <path d="M0 120 V70 A30 30 0 0 1 60 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
  <path d="M60 120 V70 A30 30 0 0 1 120 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
</svg>
`)}`;

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
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 20% 15%, #1E293B, transparent 55%), radial-gradient(circle at 85% 80%, #334155, transparent 50%), linear-gradient(160deg, #0B0E17 0%, #111827 55%, #0F172A 100%)" }}
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: "-140px", left: "-100px", width: "480px", height: "480px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(51,65,85,0.30), transparent 70%)",
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        bottom: "-160px", right: "-120px", width: "500px", height: "500px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(217,180,108,0.10), transparent 70%)",
      }} />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-6 animate-in">
          <div className="inline-flex items-center justify-center mb-2">
            <Image src="/estate-logo-white.png" alt="Estate Department" width={880} height={900} priority className="w-36 h-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Admin / HR Login</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Access the HR management dashboard</p>
        </div>

        <div
          className="p-8 animate-in animate-in-delay-1"
          style={{
            borderRadius: "28px",
            backgroundColor: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>USERNAME</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow text-white"
                style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)" }}
                onFocus={e => { e.target.style.borderColor = "#D9B46C"; e.target.style.boxShadow = "0 0 0 3.5px rgba(217,180,108,0.14)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow text-white"
                style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.05)" }}
                onFocus={e => { e.target.style.borderColor = "#D9B46C"; e.target.style.boxShadow = "0 0 0 3.5px rgba(217,180,108,0.14)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(220,38,38,0.18)", color: "#FCA5A5", border: "1px solid rgba(220,38,38,0.3)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: "#C9A05C",
                color: "#0F172A",
                opacity: loading ? 0.75 : 1,
                boxShadow: loading ? "none" : "0 4px 18px rgba(201,160,92,0.3)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 animate-in animate-in-delay-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          Khidmat Guzar?{" "}
          <Link href="/login" className="font-medium" style={{ color: "#D9B46C" }}>
            Khidmat Guzar Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
