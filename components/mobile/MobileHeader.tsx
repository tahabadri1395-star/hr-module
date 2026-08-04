import NotificationBell from "@/components/NotificationBell";
import { bg, ink, muted, accentGradient } from "@/lib/mobile-theme";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function MobileHeader({ name }: { name: string }) {
  const firstName = name.split(" ")[0];
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-16"
      style={{ backgroundColor: bg, paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: accentGradient }}
        >
          {firstName.charAt(0)}
        </div>
        <div>
          <p className="text-[11px] leading-tight" style={{ color: muted }}>{greeting()}</p>
          <p className="text-sm font-bold leading-tight" style={{ color: ink }}>{firstName}</p>
        </div>
      </div>
      <NotificationBell />
    </header>
  );
}
