import type { Metadata } from "next";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "3D race",
  description: "Two robots race up the temperature hill: one follows ∇T, the other aims straight at the source.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
