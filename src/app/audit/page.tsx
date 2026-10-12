import { Metadata } from "next";
import { AuditClient } from "./AuditClient";

export const metadata: Metadata = {
  title: "Owner Live Monitor — Concept I Gym",
  description: "Live staff activity feed and real-time push alerts for Concept I Gym owner",
};

export default function AuditPage() {
  return <AuditClient />;
}
