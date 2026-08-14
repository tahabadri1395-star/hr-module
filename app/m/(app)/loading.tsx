import { bg, neuInset } from "@/lib/mobile-theme";

function Block({ h }: { h: string }) {
  return <div className="rounded-3xl animate-pulse" style={{ height: h, backgroundColor: bg, boxShadow: neuInset }} />;
}

export default function MobileLoading() {
  return (
    <div className="space-y-4 pb-2">
      <Block h="8rem" />
      <div className="grid grid-cols-2 gap-3">
        <Block h="5.5rem" />
        <Block h="5.5rem" />
      </div>
      <Block h="10rem" />
    </div>
  );
}
