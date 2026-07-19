import { Hero } from "@/components/sections/Hero";
import { NewPhaseWay } from "@/components/sections/NewPhaseWay";
import { Personalisation } from "@/components/sections/Personalisation";
import { ClientsPreview } from "@/components/sections/ClientsPreview";
import { CoachesSection } from "@/components/sections/CoachesSection";
import { Experience } from "@/components/sections/Experience";
import { PackagesPreview } from "@/components/sections/PackagesPreview";
import { TestimonialsPreview } from "@/components/sections/TestimonialsPreview";
import { FinalCta } from "@/components/sections/FinalCta";
import { Preloader } from "@/components/ui/Preloader";
import { ScrollDumbbell } from "@/components/3d/ScrollDumbbell";

export default function HomePage() {
  return (
    <>
      <ScrollDumbbell />
      <Preloader />
      <Hero />
      <NewPhaseWay />
      <Personalisation />
      <ClientsPreview />
      <CoachesSection />
      <Experience />
      <PackagesPreview />
      <TestimonialsPreview />
      <FinalCta />
    </>
  );
}
