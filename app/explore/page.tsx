import type { Metadata } from "next";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "3D hill · Following the Heat to Its Source",
  description: "The temperature field as a 3D hill: watch the robot climb along the gradient.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
