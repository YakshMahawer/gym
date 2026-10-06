import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Concept I Gym | Management CRM",
  description: "Modern, minimal and simple Gym CRM for memberships, sales, dues and member tracking",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <AuthProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </AuthProvider>
  );
}

