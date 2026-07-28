import NotificationBell from "@/components/NotificationBell";

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
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-14"
      style={{ backgroundColor: "rgba(248,250,252,0.85)", backdropFilter: "blur(20px)", paddingTop: "env(safe-area-inset-top)" }}
    >
      <div>
        <p className="text-[11px] leading-tight" style={{ color: "#94A3B8" }}>{greeting()}</p>
        <p className="text-sm font-semibold leading-tight" style={{ color: "#1E293B" }}>{firstName}</p>
      </div>
      <NotificationBell />
    </header>
  );
}
