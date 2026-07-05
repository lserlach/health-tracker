import type { Metadata, Viewport } from "next";
import { Inter_Tight, Manrope } from "next/font/google";
import { MobileViewport } from "@/components/layout/mobile-viewport";
import { ServiceWorkerRegister } from "@/components/notifications/service-worker-register";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Дневник здоровья",
  description: "Личный дневник здоровья при беременности",
  applicationName: "Дневник здоровья",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Дневник",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#9279FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${interTight.variable} ${manrope.variable} h-full bg-background`}>
      <body className="h-dvh overflow-hidden bg-background antialiased md:h-auto md:min-h-full md:overflow-visible">
        <ServiceWorkerRegister />
        <MobileViewport>{children}</MobileViewport>
      </body>
    </html>
  );
}
