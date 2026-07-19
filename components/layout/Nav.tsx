"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { assetUrl } from "@/lib/base-path";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/clients/", label: "Clients" },
  { href: "/testimonials/", label: "Testimonials" },
  { href: "/packages/", label: "Packages" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass py-2.5 md:py-3" : "bg-transparent py-3.5 md:py-5"
        }`}
      >
        <nav className="container-np flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-off-white"
            aria-label="NewPhase Coaching home"
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--edge-strong)]">
              <img
                src={assetUrl("/brand/nav-duo.png")}
                alt=""
                width={72}
                height={72}
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover object-center"
              />
            </span>
            <LogoMark boxClassName="h-9 w-9" priority />
            <span className="font-display text-2xl tracking-wide">
              NEW<span className="text-accent">PHASE</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-9 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`link-underline text-sm font-medium tracking-wide transition-colors ${
                    isActive(l.href)
                      ? "text-accent"
                      : "text-soft-silver hover:text-off-white"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Link href="/apply/" className="btn btn-primary !px-6 !py-3">
              Apply Now
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={`h-0.5 w-6 bg-off-white transition-all duration-300 ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-off-white transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-off-white transition-all duration-300 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-obsidian px-8 transition-all duration-500 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="space-y-3">
          <li className="mb-8 flex items-center gap-3">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--edge-strong)]">
              <img
                src={assetUrl("/brand/nav-duo.png")}
                alt=""
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            </span>
            <LogoMark boxClassName="h-16 w-16" glow="hero" />
          </li>
          {LINKS.map((l, i) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`display-xl block transition-colors ${
                  isActive(l.href) ? "text-accent" : "text-off-white"
                }`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/apply/" className="btn btn-primary mt-10 w-full">
          Apply Now
        </Link>
      </div>
    </>
  );
}

export default Nav;
