import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
}

export function PageHeader({ eyebrow, title, intro }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden pt-40 pb-16">
      <div className="container-np">
        {eyebrow && (
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-accent" aria-hidden />
              {eyebrow}
            </p>
          </Reveal>
        )}
        <Reveal delay={80}>
          <h1 className="display-xl text-gradient max-w-4xl">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel">
              {intro}
            </p>
          </Reveal>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
