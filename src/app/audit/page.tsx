import { Metadata } from "next";
import { AuditClient } from "./AuditClient";

export const metadata: Metadata = {
  title: "Owner Live Monitor — Concept 1 Gym",
  description: "Live staff activity feed and real-time push alerts for Concept 1 Gym owner",
};

export default function AuditPage() {
  return <AuditClient />;
}
