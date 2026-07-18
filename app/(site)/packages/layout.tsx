import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Coaching Packages",
  description:
    "Compare NewPhase Coaching packages. Transparent pricing and the level of support that matches your goals.",
};

export default function PackagesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
