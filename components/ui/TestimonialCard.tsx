import type { Testimonial } from "@/types/newphase";

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i < rating ? "text-accent" : "text-graphite"}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="surface flex h-full flex-col rounded-2xl p-7">
      <Stars rating={item.rating ?? 5} />
      <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-soft-silver">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-4 border-t border-[color:var(--edge)] pt-5">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-graphite font-display text-lg text-accent">
            {item.name?.charAt(0) || "N"}
          </span>
        )}
        <div>
          <p className="font-semibold text-off-white">{item.name}</p>
          {(item.role || item.result) && (
            <p className="text-xs text-steel">{item.result || item.role}</p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

export default TestimonialCard;
