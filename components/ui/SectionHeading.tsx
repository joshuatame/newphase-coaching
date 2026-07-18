import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      {eyebrow && (
        <Reveal>
          <p className="eyebrow mb-4 flex items-center gap-3">
            {align === "center" && (
              <span className="h-px w-8 bg-accent/60" aria-hidden />
            )}
            {eyebrow}
            <span className="h-px w-8 bg-accent/60" aria-hidden />
          </p>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className="display-lg text-gradient">{title}</h2>
      </Reveal>
      {intro && (
        <Reveal delay={160}>
          <p className="mt-5 text-lg leading-relaxed text-steel">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

export default SectionHeading;
