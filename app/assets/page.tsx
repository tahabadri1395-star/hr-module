"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Asset {
  id: number; name: string; asset_type: string; serial_number: string | null;
  license_key: string | null; description: string | null; assigned_at: string; notes: string | null;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  laptop:    { label: "Laptop",    color: "#1D4ED8", bg: "#EFF6FF", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  software:  { label: "Software",  color: "#7C3AED", bg: "#EDE9FE", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  paid_app:  { label: "Paid App",  color: "#059669", bg: "#ECFDF5", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  hardware:  { label: "Hardware",  color: "#B45309", bg: "#FFFBEB", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  other:     { label: "Other",     color: "#475569", bg: "#F8FAFC", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
};

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/assets");
    if (res.ok) { const d = await res.json(); setAssets(d.assets); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    (acc[a.asset_type] = acc[a.asset_type] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4FF" }}>
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold text-sm text-white">HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs text-white/70">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>My Assets</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Assets and software assigned to you</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl py-12 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm" style={{ color: "#94A3B8" }}>Loading…</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1E293B" }}>No assets assigned</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Your assigned equipment and software will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] || TYPE_META.other;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.bg }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d={meta.icon} stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>· {items.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map(asset => (
                      <div key={asset.id} className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: "#1E293B" }}>{asset.name}</p>
                            {asset.description && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{asset.description}</p>}
                            <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>Assigned {fmt(asset.assigned_at)}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                        </div>
                        {(asset.serial_number || asset.license_key) && (
                          <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid #F1F5F9" }}>
                            {asset.serial_number && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: "#94A3B8" }}>Serial:</span>
                                <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}>{asset.serial_number}</code>
                              </div>
                            )}
                            {asset.license_key && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: "#94A3B8" }}>License:</span>
                                <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}>{asset.license_key}</code>
                              </div>
                            )}
                          </div>
                        )}
                        {asset.notes && (
                          <p className="text-xs mt-2 italic" style={{ color: "#94A3B8" }}>{asset.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
