"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { pageBg, ARCH_PATTERN, ink, muted, mutedFaint, glassCard } from "@/lib/desktop-theme";

interface Asset {
  id: number; name: string; asset_type: string; serial_number: string | null;
  license_key: string | null; description: string | null; assigned_at: string; notes: string | null;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  laptop:    { label: "Laptop",    color: "#60A5FA", bg: "rgba(96,165,250,0.15)", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  software:  { label: "Software",  color: "#A78BFA", bg: "rgba(167,139,250,0.15)", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  paid_app:  { label: "Paid App",  color: "#34D399", bg: "rgba(52,211,153,0.15)", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  hardware:  { label: "Hardware",  color: "#D9B46C", bg: "rgba(217,180,108,0.15)", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  other:     { label: "Other",     color: muted, bg: "rgba(255,255,255,0.08)", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
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
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("${ARCH_PATTERN}")`, backgroundSize: "120px 120px" }} />
      <nav className="px-6 h-14 flex items-center justify-between sticky top-0 z-10 relative" style={{ backgroundColor: "rgba(20,21,43,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img src="/estate-mark-white.png" alt="Estate Department" className="w-11 h-11 object-contain" />
          <span className="font-semibold text-sm" style={{ color: ink }}>HR Module</span>
        </div>
        <Link href="/dashboard" className="text-xs" style={{ color: muted }}>← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 relative">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: ink }}>My Assets</h1>
          <p className="text-sm mt-0.5" style={{ color: muted }}>Assets and software assigned to you</p>
        </div>

        {loading ? (
          <div className="rounded-2xl py-12 text-center" style={glassCard}>
            <p className="text-sm" style={{ color: muted }}>Loading…</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={glassCard}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke={mutedFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: ink }}>No assets assigned</p>
            <p className="text-xs mt-1" style={{ color: muted }}>Your assigned equipment and software will appear here</p>
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
                    <span className="text-xs" style={{ color: mutedFaint }}>· {items.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map(asset => (
                      <div key={asset.id} className="rounded-2xl px-5 py-4" style={glassCard}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: ink }}>{asset.name}</p>
                            {asset.description && <p className="text-xs mt-0.5" style={{ color: muted }}>{asset.description}</p>}
                            <p className="text-xs mt-1.5" style={{ color: mutedFaint }}>Assigned {fmt(asset.assigned_at)}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                        </div>
                        {(asset.serial_number || asset.license_key) && (
                          <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            {asset.serial_number && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: mutedFaint }}>Serial:</span>
                                <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: ink }}>{asset.serial_number}</code>
                              </div>
                            )}
                            {asset.license_key && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: mutedFaint }}>License:</span>
                                <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: ink }}>{asset.license_key}</code>
                              </div>
                            )}
                          </div>
                        )}
                        {asset.notes && (
                          <p className="text-xs mt-2 italic" style={{ color: mutedFaint }}>{asset.notes}</p>
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
