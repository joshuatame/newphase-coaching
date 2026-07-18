import type { ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollDumbbell } from "@/components/3d/ScrollDumbbell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollDumbbell />
      <Nav />
      <main id="main" className="relative z-10">
        {children}
      </main>
      <Footer />
    </>
  );
}
