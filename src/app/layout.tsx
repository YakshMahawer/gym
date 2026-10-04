import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

export const metadata: Metadata = {
  title: "Concept 1 Gym & Fitness | Manjalpur, Vadodara",
  description: "Concept 1 Proactive Fitness in Manjalpur, Vadodara. Explore our training floor, cardio facilities, and memberships.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('gym_crm_theme');
                if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
