// Shared "glass" dark theme for the desktop app — matches the login pages.
import type { CSSProperties } from "react";

export const ARCH_PATTERN = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <path d="M0 120 V70 A30 30 0 0 1 60 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
  <path d="M60 120 V70 A30 30 0 0 1 120 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
</svg>
`)}`;

export const pageBg = "radial-gradient(circle at 20% 15%, #2A2560, transparent 55%), radial-gradient(circle at 85% 80%, #3B2F6E, transparent 50%), linear-gradient(160deg, #14152B 0%, #1B1B3A 55%, #211A3E 100%)";
export const adminPageBg = "radial-gradient(circle at 20% 15%, #1E293B, transparent 55%), radial-gradient(circle at 85% 80%, #334155, transparent 50%), linear-gradient(160deg, #0B0E17 0%, #111827 55%, #0F172A 100%)";

export const ink = "#FFFFFF";
export const muted = "rgba(255,255,255,0.6)";
export const mutedFaint = "rgba(255,255,255,0.45)";
export const gold = "#D9B46C";
export const goldSolid = "#C9A05C";

export const glassCard: CSSProperties = {
  borderRadius: "24px",
  backgroundColor: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
};

export const glassCardSm: CSSProperties = {
  borderRadius: "18px",
  backgroundColor: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.10)",
};

export const glassPill: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
};

export const goldButton: CSSProperties = {
  backgroundColor: goldSolid,
  color: "#1B1630",
  boxShadow: "0 4px 18px rgba(201,160,92,0.3)",
};
