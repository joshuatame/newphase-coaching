"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isAuthenticated, clearToken } from "@/lib/api/client";

const NAV = [
  { href: "/admin/", label: "Dashboard" },
  { href: "/admin/clients/", label: "Clients" },
  { href: "/admin/testimonials/", label: "Testimonials" },
  { href: "/admin/packages/", label: "Packages" },
  { href: "/admin/content/", label: "Content" },
  { href: "/admin/enquiries/", label: "Enquiries" },
  { href: "/admin/settings/", label: "Settings" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login/");
    } else {
      setReady(true);
    }
  }, [router]);

  const logout = () => {
    clearToken();
    router.replace("/admin/login/");
  };

  const isActive = (href: string) =>
    href === "/admin/"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(href);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <span className="eyebrow animate-pulse-soft">Loading admin…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-off-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[color:var(--edge)] bg-near-black transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-6">
          <Link href="/admin/" className="font-display text-2xl tracking-wide">
            NEW<span className="text-accent">PHASE</span>
            <span className="ml-2 text-xs text-steel">admin</span>
          </Link>
          <nav className="mt-10 flex-1 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-accent/10 text-accent"
                    : "text-soft-silver hover:bg-graphite hover:text-off-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2">
            <Link
              href="/"
              className="block rounded-lg px-4 py-2.5 text-sm text-steel hover:text-off-white"
            >
              View site ↗
            </Link>
            <button
              onClick={logout}
              className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-steel hover:text-off-white"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-obsidian/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[color:var(--edge)] bg-obsidian/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h1 className="font-display text-2xl tracking-wide">{title}</h1>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
