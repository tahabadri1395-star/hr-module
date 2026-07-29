import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HR Module",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function MobileRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
