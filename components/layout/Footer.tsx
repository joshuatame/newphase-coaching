import Link from "next/link";

const NAV = [
  { href: "/clients/", label: "Clients" },
  { href: "/testimonials/", label: "Testimonials" },
  { href: "/packages/", label: "Packages" },
  { href: "/apply/", label: "Apply" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-[color:var(--edge)] bg-near-black">
      <div className="container-np py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="font-display text-3xl tracking-wide text-off-white"
            >
              NEW<span className="text-accent">PHASE</span>
            </Link>
            <p className="mt-5 max-w-sm leading-relaxed text-steel">
              Personalised online coaching engineered around your life. Build
              your next phase — stronger, leaner and in control.
            </p>
            <Link href="/apply/" className="btn btn-primary mt-7">
              Start Your Next Phase
            </Link>
          </div>

          <div>
            <p className="eyebrow mb-5">Explore</p>
            <ul className="space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-underline text-soft-silver hover:text-off-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-5">Connect</p>
            <ul className="space-y-3 text-soft-silver">
              <li>
                <a
                  href="mailto:hello@newphasecoaching.com"
                  className="link-underline hover:text-off-white"
                >
                  hello@newphasecoaching.com
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline hover:text-off-white"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline hover:text-off-white"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[color:var(--edge)] pt-8 text-xs text-steel sm:flex-row sm:items-center">
          <p>© {year} NewPhase Coaching. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/admin/login/" className="hover:text-off-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
