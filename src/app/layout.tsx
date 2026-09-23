import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

export const metadata: Metadata = {
  title: "Concept I Gym | Management CRM",
  description: "Modern, minimal and simple Gym CRM for memberships, sales, dues and member tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
