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
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-16"
      style={{
        backgroundColor: "rgba(248,250,252,0.85)",
        backdropFilter: "blur(20px)",
        paddingTop: "env(safe-area-inset-top)",
        borderBottom: "1px solid rgba(226,232,240,0.6)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}
        >
          {firstName.charAt(0)}
        </div>
        <div>
          <p className="text-[11px] leading-tight" style={{ color: "#94A3B8" }}>{greeting()}</p>
          <p className="text-sm font-semibold leading-tight" style={{ color: "#1E293B" }}>{firstName}</p>
        </div>
      </div>
      <NotificationBell />
    </header>
  );
}
