import type { Metadata, Viewport } from "next";

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
      <body
        style={{
          backgroundColor: "#0B0F17",
          color: "#F8FAFC",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
