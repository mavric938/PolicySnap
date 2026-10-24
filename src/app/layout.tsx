import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/presentation/context/AuthContext";
import SessionWatcher from "@/components/SessionWatcher";
import "./globals.css";

// Font di-self-host oleh next/font (tanpa request render-blocking ke Google Fonts)
const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

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
  // Zoom tidak dikunci (WCAG 1.4.4 — teks harus bisa diperbesar)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1115" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SessionWatcher />
          <div id="app-root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
