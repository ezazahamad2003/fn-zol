import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZOL — voice core",
  description: "ZOL multi-tenant voice agent dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
