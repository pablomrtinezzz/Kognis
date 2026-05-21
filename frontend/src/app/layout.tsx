import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0B0F17",
};

export const metadata: Metadata = {
  title: "Kognis",
  description: "Your ultimate self-improvement PWA",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning evita que las extensiones del navegador rompan Next.js
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
