import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "广东C3安考宝典",
  description: "广东C3安考宝典 - 驾考学习助手",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "C3安考宝典",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="C3安考宝典" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`antialiased bg-gray-100`}>
        <Providers>
          <div className="mx-auto max-w-lg min-h-screen bg-gray-50 shadow-2xl">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
