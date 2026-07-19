import { Hero } from "@/components/sections/Hero";
import { NewPhaseWay } from "@/components/sections/NewPhaseWay";
import { ClientsPreview } from "@/components/sections/ClientsPreview";
import { TrainerProfile } from "@/components/sections/TrainerProfile";
import { Personalisation } from "@/components/sections/Personalisation";
import { Experience } from "@/components/sections/Experience";
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
      <ClientsPreview />
      <TrainerProfile />
      <Personalisation />
      <Experience />
      <PackagesPreview />
      <TestimonialsPreview />
      <FinalCta />
    </>
  );
}
