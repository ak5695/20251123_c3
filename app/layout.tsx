import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "广东C3安考宝典",
  description: "广东C3安考宝典",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
