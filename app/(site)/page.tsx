import { Hero } from "@/components/sections/Hero";
import { NewPhaseWay } from "@/components/sections/NewPhaseWay";
import { Personalisation } from "@/components/sections/Personalisation";
import { SelectedPhotoRail } from "@/components/sections/SelectedPhotoRail";
import { CoachesSection } from "@/components/sections/CoachesSection";
import { Experience } from "@/components/sections/Experience";
import { ClientsPreview } from "@/components/sections/ClientsPreview";
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
      <SelectedPhotoRail />
      <CoachesSection />
      <Experience />
      <ClientsPreview />
      <PackagesPreview />
      <TestimonialsPreview />
      <FinalCta />
    </>
  );
}
