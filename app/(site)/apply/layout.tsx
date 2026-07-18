import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Apply for Coaching",
  description:
    "Apply for personalised online coaching with NewPhase. Tell us your goals and start your next phase.",
};

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
