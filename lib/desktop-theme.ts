// Shared "glass" dark theme for the desktop app — matches the login pages.
import type { CSSProperties } from "react";

export const ARCH_PATTERN = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <path d="M0 120 V70 A30 30 0 0 1 60 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
  <path d="M60 120 V70 A30 30 0 0 1 120 70 V120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
</svg>
`)}`;

export const pageBg = "radial-gradient(circle at 20% 15%, #5A7090, transparent 55%), radial-gradient(circle at 85% 80%, #64708C, transparent 50%), linear-gradient(160deg, #34425A 0%, #3B4A63 55%, #424D68 100%)";
export const adminPageBg = "radial-gradient(circle at 20% 15%, #4B5A70, transparent 55%), radial-gradient(circle at 85% 80%, #56647A, transparent 50%), linear-gradient(160deg, #283244 0%, #2F3A4D 55%, #344055 100%)";

export const ink = "#FFFFFF";
export const muted = "rgba(255,255,255,0.72)";
export const mutedFaint = "rgba(255,255,255,0.58)";
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
