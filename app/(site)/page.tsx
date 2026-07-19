import { Hero } from "@/components/sections/Hero";
import { NewPhaseWay } from "@/components/sections/NewPhaseWay";
import { Personalisation } from "@/components/sections/Personalisation";
import { ClientsPreview } from "@/components/sections/ClientsPreview";
import { Experience } from "@/components/sections/Experience";
import { CoachesSection } from "@/components/sections/CoachesSection";
import { PackagesPreview } from "@/components/sections/PackagesPreview";
import { TestimonialsPreview } from "@/components/sections/TestimonialsPreview";
import { FinalCta } from "@/components/sections/FinalCta";
import { Preloader } from "@/components/ui/Preloader";

export default function HomePage() {
  return (
    <>
      <Preloader />
      <Hero />
      <NewPhaseWay />
      <Personalisation />
      <ClientsPreview />
      <Experience />
      <CoachesSection />
      <PackagesPreview />
      <TestimonialsPreview />
      <FinalCta />
    </>
  );
}
