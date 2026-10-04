import React from "react";
import type { Metadata } from "next";
import { WebsiteHome } from "@/components/website/WebsiteHome";

export const metadata: Metadata = {
  title: "Gym in Manjalpur, Vadodara | Concept 1 Gym & Fitness",
  description:
    "Looking for a gym in Manjalpur, Vadodara? Explore Concept 1's training floor, cardio facilities, heavy weights, and personal training.",
};

export default function PublicHomePage() {
  return <WebsiteHome />;
}
