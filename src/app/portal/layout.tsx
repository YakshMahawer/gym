import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Concept I Gym | Management CRM",
  description: "Modern, minimal and simple Gym CRM for memberships, sales, dues and member tracking",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
