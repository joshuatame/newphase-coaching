"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Modal,
  Select,
  type Column,
} from "@/components/admin/ui";
import {
  adminGetEnquiries,
  adminUpdateEnquiry,
  adminDeleteEnquiry,
} from "@/lib/api/newphase";
import type { Enquiry } from "@/types/newphase";

const STATUSES: Array<"new" | "contacted" | "converted" | "archived"> = [
  "new",
  "contacted",
  "converted",
  "archived",
];

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetEnquiries());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (
    e: Enquiry,
    status: "new" | "contacted" | "converted" | "archived",
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === e.id ? { ...r, status } : r)),
    );
    if (selected?.id === e.id) setSelected({ ...selected, status });
    await adminUpdateEnquiry(e.id, { status }).catch(() => {});
  };

  const remove = async (e: Enquiry) => {
    if (!confirm(`Close application from "${e.name}"?`)) return;
    await adminDeleteEnquiry(e.id).catch(() => {});
    setSelected(null);
    await load();
  };

  const filtered =
    filter === "all"
      ? rows
      : rows.filter((r) => (r.status || "new") === filter);

  const columns: Column<Enquiry>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "goal",
      header: "Goal",
      render: (r) => r.goal || r.primaryGoal || "—",
    },
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
    <AdminShell title="Applications">
      <p className="mb-6 max-w-2xl text-sm text-steel">
        Coaching applications from the public apply form. Update status as you
        progress each lead.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
              filter === s
                ? "bg-accent text-obsidian"
                : "border border-[color:var(--edge-strong)] text-soft-silver hover:text-off-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty="No applications in this view."
          actions={(row) => (
            <>
              <AdminButton variant="ghost" onClick={() => setSelected(row)}>
                View
              </AdminButton>
              <AdminButton variant="danger" onClick={() => remove(row)}>
                Close
              </AdminButton>
            </>
          )}
        />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Application Detail"
        footer={
          selected && (
            <>
              <Select
                value={(selected.status as string) || "new"}
                onChange={(e) =>
                  updateStatus(
                    selected,
                    e.target.value as
                      | "new"
                      | "contacted"
                      | "converted"
                      | "archived",
                  )
                }
                className="!w-auto"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <AdminButton
                variant="danger"
                onClick={() => selected && remove(selected)}
              >
                Close
              </AdminButton>
            </>
          )
        }
      >
        {selected && (
          <dl className="space-y-4 text-sm">
            {[
              ["Name", selected.name],
              ["Email", selected.email],
              ["Phone", selected.phone],
              ["Experience", selected.experience || selected.trainingExperience],
              ["Goal", selected.goal || selected.primaryGoal],
              ["Challenge", selected.challenge || selected.currentChallenge],
              ["Success looks like", selected.success || selected.successDefinition],
              ["Message", selected.message],
              ["Source", selected.source],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs uppercase tracking-[0.15em] text-steel">
                  {label}
                </dt>
                <dd className="mt-1 text-soft-silver">
                  {value ? String(value) : "—"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </AdminShell>
  );
}
