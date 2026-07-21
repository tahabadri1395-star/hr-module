"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/dashboard");
      router.refresh();
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
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V9l5-5h7a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M7 9H3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M9 13h6M9 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E293B" }}>Khidmat Guzar Portal</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Sign in to manage your leave applications</p>
        </div>

        <div className="bg-white rounded-xl border p-8" style={{ borderColor: "#E2E8F0" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>
                ITS Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.its_number}
                onChange={e => setForm({ ...form, its_number: e.target.value })}
                placeholder="e.g. 30303943"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => (e.target.style.borderColor = "#4F46E5")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                onFocus={e => (e.target.style.borderColor = "#4F46E5")}
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
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#94A3B8" }}>
          Admin or HR?{" "}
          <Link href="/admin/login" className="font-medium" style={{ color: "#4F46E5" }}>
            Admin Login →
          </Link>
        </p>

      </div>
    </div>
  );
}
