"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { bg, ink, muted, neuRaised, neuInset, accentGradient, accentShadow } from "@/lib/mobile-theme";

export default function MobileLoginPage() {
  const [form, setForm] = useState({ its_number: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
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
      window.location.href = "/m/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6" style={{ backgroundColor: bg }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: accentGradient, boxShadow: accentShadow }}
          >
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: ink }}>HR Module</h1>
          <p className="text-sm mt-1.5" style={{ color: muted }}>Sign in to your Khidmat Guzar account</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: muted }}>ITS NUMBER</label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={form.its_number}
              onChange={e => setForm({ ...form, its_number: e.target.value })}
              placeholder="e.g. 30303943"
              className="w-full px-4 py-3.5 rounded-2xl text-base outline-none"
              style={{ backgroundColor: bg, color: ink, boxShadow: neuInset }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: muted }}>PASSWORD</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl text-base outline-none"
              style={{ backgroundColor: bg, color: ink, boxShadow: neuInset }}
              required
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: bg, boxShadow: neuInset, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-base font-bold text-white"
            style={{ background: accentGradient, boxShadow: accentShadow, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
