import type { Metadata } from "next";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "The race in 3D · Two Robots, One Fire",
  description: "Two robots race up the temperature hill: one follows ∇T, the other aims straight at the source.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
