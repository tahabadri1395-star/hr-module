import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leave Portal",
  description: "Leave management portal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
