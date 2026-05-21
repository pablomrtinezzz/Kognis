import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/store/AuthContext";
import MainLayout from "@/components/MainLayout";
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
