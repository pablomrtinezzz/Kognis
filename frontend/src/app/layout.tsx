import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/store/AuthContext";
import MainLayout from "@/components/MainLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#09090E",
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
    <html
      lang="es"
      className={`${inter.variable} w-full`}
      suppressHydrationWarning
    >
      <body
        className="antialiased w-full"
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100dvh",
          color: "rgb(242,244,248)",
        }}
      >
        {/* Fixed ambient background — rendered at the CSS layer so backdrop-filter has something to blur */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
            background: [
              "radial-gradient(circle at 15% 50%, rgba(37,119,255,0.08), transparent 25%)",
              "radial-gradient(circle at 85% 30%, rgba(16,185,129,0.04), transparent 25%)",
              "#09090E",
            ].join(", "),
          }}
        />
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
