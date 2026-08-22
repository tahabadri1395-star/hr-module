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
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 20% 15%, #2A2560, transparent 55%), radial-gradient(circle at 85% 80%, #3B2F6E, transparent 50%), linear-gradient(160deg, #14152B 0%, #1B1B3A 55%, #211A3E 100%)" }}
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        top: "-140px", right: "-100px", width: "480px", height: "480px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(124,58,237,0.22), transparent 70%)",
      }} />
      <div aria-hidden className="absolute pointer-events-none" style={{
        bottom: "-160px", left: "-120px", width: "500px", height: "500px", borderRadius: "9999px",
        background: "radial-gradient(circle, rgba(217,180,108,0.12), transparent 70%)",
      }} />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-6 animate-in">
          <div className="inline-flex items-center justify-center mb-2">
            <Image src="/estate-logo-white.png" alt="Estate Department" width={880} height={900} priority className="w-36 h-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Khidmat Guzar Portal</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Sign in to access your HR portal</p>
        </div>

        <div
          className="p-8 animate-in animate-in-delay-1"
          style={{
            borderRadius: "28px",
            backgroundColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
                ITS NUMBER
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.its_number}
                onChange={e => setForm({ ...form, its_number: e.target.value })}
                placeholder="e.g. 30303943"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow text-white"
                style={{ borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.06)" }}
                onFocus={e => { e.target.style.borderColor = "#D9B46C"; e.target.style.boxShadow = "0 0 0 3.5px rgba(217,180,108,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.16)"; e.target.style.boxShadow = "none"; }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-shadow text-white"
                style={{ borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.06)" }}
                onFocus={e => { e.target.style.borderColor = "#D9B46C"; e.target.style.boxShadow = "0 0 0 3.5px rgba(217,180,108,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.16)"; e.target.style.boxShadow = "none"; }}
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
                background: "linear-gradient(135deg, #D9B46C, #B8935090)",
                backgroundColor: "#C9A05C",
                color: "#1B1630",
                opacity: loading ? 0.75 : 1,
                boxShadow: loading ? "none" : "0 4px 18px rgba(201,160,92,0.35)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 animate-in animate-in-delay-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          Admin or HR?{" "}
          <Link href="/admin/login" className="font-medium" style={{ color: "#D9B46C" }}>
            Admin Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
