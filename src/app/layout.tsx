import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/presentation/context/AuthContext";
import SessionWatcher from "@/components/SessionWatcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolicySnap — Crowdsourcing Analisis Kebijakan",
  description:
    "Platform crowdsourcing evaluasi kebijakan publik. Nilai, diskusikan, dan bagikan analisis kebijakan secara metodologis melalui antarmuka yang interaktif.",
  keywords: [
    "kebijakan publik",
    "crowdsourcing",
    "evaluasi kebijakan",
    "analisis kebijakan",
    "partisipasi publik",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PolicySnap",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F6F7FB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SessionWatcher />
          <div id="app-root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
