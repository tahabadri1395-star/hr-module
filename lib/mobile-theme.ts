// "Soft Focus" neumorphic design tokens for the /m/* mobile app.
// Every raised surface shares the same page background so depth comes
// entirely from dual soft shadows, not color or borders.
import type { CSSProperties } from "react";

export const bg = "#EEF0F3";
export const ink = "#2B2E33";
export const muted = "#9AA1AC";
export const accent = "#4F46E5";
export const accentGradient = "linear-gradient(135deg, #6366F1, #818CF8)";

export const neuRaised = "8px 8px 16px #D1D4D9, -8px -8px 16px #FFFFFF";
export const neuRaisedSm = "5px 5px 10px #D1D4D9, -5px -5px 10px #FFFFFF";
export const neuInset = "inset 3px 3px 6px rgba(0,0,0,0.06), inset -3px -3px 6px rgba(255,255,255,0.7)";
export const accentShadow = "6px 6px 14px rgba(99,102,241,0.35), -3px -3px 10px rgba(255,255,255,0.6)";

export const cardStyle: CSSProperties = {
  backgroundColor: bg,
  boxShadow: neuRaised,
};

export const iconWellStyle: CSSProperties = {
  backgroundColor: bg,
  boxShadow: neuInset,
};

export const accentButtonStyle: CSSProperties = {
  background: accentGradient,
  boxShadow: accentShadow,
  color: "white",
};
