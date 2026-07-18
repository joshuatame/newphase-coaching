"use client";

import { useState } from "react";
import type { Faq } from "@/types/newphase";

export function Accordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  if (!items.length) {
    return (
      <p className="text-steel">Answers to common questions are on the way.</p>
    );
  }

  return (
    <div className="divide-y divide-[color:var(--edge)] border-y border-[color:var(--edge)]">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-accent focus:outline-none focus-visible:text-accent"
              >
                <span className="font-display text-xl uppercase tracking-wide text-off-white">
                  {item.question}
                </span>
                <span
                  className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[color:var(--edge-strong)] transition-transform duration-300 ${
                    isOpen ? "rotate-45 border-accent text-accent" : "text-steel"
                  }`}
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] pb-6 opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl leading-relaxed text-steel">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
