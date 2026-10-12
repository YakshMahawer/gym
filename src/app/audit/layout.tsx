import type { Metadata, Viewport } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Concept I — Owner Live Monitor",
  description: "Executive staff activity and audit feed with live push alerts for Concept I Gym",
  manifest: "/manifest-audit.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Owner Monitor",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest-audit.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
