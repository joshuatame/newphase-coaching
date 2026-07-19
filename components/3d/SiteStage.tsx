"use client";

import { usePathname } from "next/navigation";
import { ScrollDumbbell } from "./ScrollDumbbell";

/** Fixed brand backdrop on every page; 3D dumbbell only on the homepage. */
export function SiteStage() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return <ScrollDumbbell showDumbbell={isHome} />;
}

export default SiteStage;
