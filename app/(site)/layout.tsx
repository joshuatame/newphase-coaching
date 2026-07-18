import type { ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollDumbbell } from "@/components/3d/ScrollDumbbell";
import { PoweredByTame } from "@/components/brand/PoweredByTame";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollDumbbell />
      <Nav />
      <main id="main" className="relative z-10 bg-transparent">
        {children}
      </main>
      <div className="relative z-10 pb-20 md:pb-16">
        <Footer />
      </div>
      <PoweredByTame />
    </>
  );
}
