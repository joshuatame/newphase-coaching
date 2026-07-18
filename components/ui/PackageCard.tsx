import Link from "next/link";
import type { Package } from "@/types/newphase";

interface PackageCardProps {
  pkg: Package;
  href?: string;
}

function CheckIcon({ on }: { on: boolean }) {
  return on ? (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 flex-none text-accent"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 flex-none text-steel/40"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PackageCard({ pkg, href = "/apply/" }: PackageCardProps) {
  const featured = Boolean(pkg.featured);
  const applyHref = `${href}${href.includes("?") ? "&" : "?"}package=${encodeURIComponent(
    pkg.slug || pkg.id,
  )}`;

  return (
    <article
      className={[
        "relative flex h-full flex-col rounded-2xl p-8 transition-transform duration-500",
        featured
          ? "surface-carbon glow-accent md:-translate-y-3"
          : "surface hover:-translate-y-1",
      ].join(" ")}
    >
      {featured && (
        <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-obsidian">
          {pkg.tier || "Most Popular"}
        </span>
      )}

      <header>
        {!featured && pkg.tier && (
          <p className="eyebrow mb-3">{pkg.tier}</p>
        )}
        <h3 className="display-lg text-off-white">{pkg.name}</h3>
        {pkg.tagline && (
          <p className="mt-3 text-sm leading-relaxed text-steel">
            {pkg.tagline}
          </p>
        )}
      </header>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl text-off-white">
          {pkg.priceLabel ||
            (pkg.price != null
              ? `${pkg.currency || "$"}${pkg.price}`
              : "Enquire")}
        </span>
        {pkg.interval && (
          <span className="text-sm text-steel">{pkg.interval}</span>
        )}
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {(pkg.features || []).map((f, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 text-sm ${
              f.included ? "text-soft-silver" : "text-steel/60"
            }`}
          >
            <CheckIcon on={f.included} />
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <Link
        href={applyHref}
        className={`btn mt-8 w-full ${featured ? "btn-primary" : "btn-ghost"}`}
      >
        {pkg.ctaLabel || "Get Started"}
      </Link>
    </article>
  );
}

export default PackageCard;
