"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, DataTable, type Column } from "@/components/admin/ui";
import {
  getDashboard,
  adminGetClients,
  adminGetTestimonials,
  adminGetPackages,
  adminGetEnquiries,
} from "@/lib/api/newphase";
import type { DashboardStats, Enquiry } from "@/types/newphase";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const dash = await getDashboard().catch(() => ({}) as DashboardStats);
        let merged: DashboardStats = { ...dash };
        // If the dashboard endpoint is thin, derive counts from list endpoints.
        if (
          merged.clients == null ||
          merged.testimonials == null ||
          merged.packages == null ||
          merged.enquiries == null
        ) {
          const [clients, testimonials, packages, enq] = await Promise.all([
            adminGetClients().catch(() => []),
            adminGetTestimonials().catch(() => []),
            adminGetPackages().catch(() => []),
            adminGetEnquiries().catch(() => []),
          ]);
          merged = {
            ...merged,
            clients: merged.clients ?? clients.length,
            testimonials: merged.testimonials ?? testimonials.length,
            packages: merged.packages ?? packages.length,
            enquiries: merged.enquiries ?? enq.length,
            newEnquiries:
              merged.newEnquiries ??
              enq.filter((e) => (e.status ?? "new") === "new").length,
            recentEnquiries: merged.recentEnquiries ?? enq.slice(0, 6),
          };
        }
        if (active) {
          setStats(merged);
          setEnquiries(merged.recentEnquiries || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const columns: Column<Enquiry>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "packageName", header: "Package", render: (r) => r.packageName || "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="rounded-full bg-graphite px-2.5 py-1 text-xs capitalize text-soft-silver">
          {r.status || "new"}
        </span>
      ),
    },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients"
          value={loading ? "—" : (stats.clients ?? 0)}
        />
        <StatCard
          label="Testimonials"
          value={loading ? "—" : (stats.testimonials ?? 0)}
        />
        <StatCard
          label="Packages"
          value={loading ? "—" : (stats.packages ?? 0)}
        />
        <StatCard
          label="Enquiries"
          value={loading ? "—" : (stats.enquiries ?? 0)}
          hint={
            stats.newEnquiries ? `${stats.newEnquiries} new` : undefined
          }
        />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            Recent Enquiries
          </h2>
          <Link
            href="/admin/enquiries/"
            className="text-sm text-accent hover:underline"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl surface" />
        ) : (
          <DataTable
            columns={columns}
            rows={enquiries}
            empty="No enquiries yet. They'll appear here as applications arrive."
          />
        )}
      </div>
    </AdminShell>
  );
}
