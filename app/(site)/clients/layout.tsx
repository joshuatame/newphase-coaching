import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Client Transformations",
  description:
    "Real transformations from NewPhase Coaching clients. Filter by goal and explore the full journeys behind the results.",
};

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
