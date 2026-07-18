"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Field,
  Modal,
  Select,
  TextArea,
  TextInput,
  Toggle,
  type Column,
} from "@/components/admin/ui";
import {
  adminGetPackages,
  adminCreatePackage,
  adminUpdatePackage,
  adminDeletePackage,
} from "@/lib/api/newphase";
import type { Package, PackageFeature } from "@/types/newphase";

const BILLING_OPTIONS = [
  { value: "week", label: "per week" },
  { value: "fortnight", label: "per fortnight" },
  { value: "month", label: "per month" },
  { value: "quarter", label: "per quarter" },
  { value: "year", label: "per year" },
  { value: "once", label: "one-off" },
  { value: "custom", label: "custom / enquire" },
];

type PackageForm = Partial<Package> & {
  priceDollars?: string;
  published?: boolean;
};

const EMPTY: PackageForm = {
  name: "",
  tier: "",
  tagline: "",
  description: "",
  priceDollars: "",
  priceDisplay: "",
  billingPeriod: "month",
  ctaLabel: "Get Started",
  featured: false,
  published: true,
  order: 0,
  features: [{ label: "", included: true }],
};

function toForm(pkg: Package): PackageForm {
  return {
    ...pkg,
    priceDollars:
      pkg.priceCents != null ? String(pkg.priceCents / 100) : "",
    priceDisplay: pkg.priceDisplay || pkg.priceLabel || "",
    billingPeriod:
      pkg.billingPeriod ||
      (pkg.interval ? String(pkg.interval).replace(/^\//, "") : "month"),
    published: (pkg as PackageForm).published !== false,
    features: pkg.features?.length
      ? pkg.features.map((f) => ({ ...f }))
      : [{ label: "", included: true }],
  };
}

export default function AdminPackagesPage() {
  const [rows, setRows] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PackageForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetPackages());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const set = (patch: PackageForm) =>
    setEditing((e) => ({ ...(e || {}), ...patch }));

  const setFeature = (i: number, patch: Partial<PackageFeature>) =>
    setEditing((e) => {
      const features = [...(e?.features || [])];
      features[i] = { ...features[i], ...patch };
      return { ...(e || {}), features };
    });

  const addFeature = () =>
    setEditing((e) => ({
      ...(e || {}),
      features: [...(e?.features || []), { label: "", included: true }],
    }));

  const removeFeature = (i: number) =>
    setEditing((e) => ({
      ...(e || {}),
      features: (e?.features || []).filter((_, idx) => idx !== i),
    }));

  const moveFeature = (i: number, dir: -1 | 1) =>
    setEditing((e) => {
      const features = [...(e?.features || [])];
      const j = i + dir;
      if (j < 0 || j >= features.length) return e || {};
      [features[i], features[j]] = [features[j], features[i]];
      return { ...(e || {}), features };
    });

  const save = async () => {
    if (!editing?.name?.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const dollars = editing.priceDollars?.trim();
    const price =
      dollars && !Number.isNaN(Number(dollars))
        ? Number(dollars)
        : undefined;

    const payload: Partial<Package> = {
      ...editing,
      price,
      priceCents:
        price != null ? Math.round(price * 100) : editing.priceCents,
      priceLabel: editing.priceDisplay || undefined,
      priceDisplay: editing.priceDisplay || undefined,
      order: Number(editing.order ?? 0),
      features: (editing.features || [])
        .map((f, i) => ({ ...f, sortOrder: i }))
        .filter((f) => f.label.trim()),
      published: editing.published !== false,
    };

    try {
      if (editing.id) await adminUpdatePackage(editing.id, payload);
      else await adminCreatePackage(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Package) => {
    if (!confirm(`Delete package "${p.name}"? This cannot be undone.`)) return;
    await adminDeletePackage(p.id).catch(() => {});
    await load();
  };

  const columns: Column<Package>[] = [
    { key: "name", header: "Name" },
    {
      key: "price",
      header: "Price",
      render: (r) => {
        const display =
          r.priceDisplay ||
          r.priceLabel ||
          (r.priceCents != null
            ? `$${(r.priceCents / 100).toFixed(r.priceCents % 100 === 0 ? 0 : 2)}`
            : "—");
        const period = r.billingPeriod ? ` / ${r.billingPeriod}` : "";
        return `${display}${period}`;
      },
    },
    {
      key: "published",
      header: "Live",
      render: (r) =>
        (r as PackageForm).published === false ? (
          <span className="text-steel">Draft</span>
        ) : (
          <span className="text-accent">Published</span>
        ),
    },
    { key: "order", header: "Order", render: (r) => r.order ?? r.sortOrder ?? 0 },
    {
      key: "featured",
      header: "Featured",
      render: (r) => (r.featured ? "Yes" : "No"),
    },
  ];

  return (
    <AdminShell title="Packages">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm text-steel">
          Create as many packages as you need. Set AUD pricing, billing period,
          features, and publish when ready. Sort order controls left-to-right
          display.
        </p>
        <AdminButton
          onClick={() => {
            setEditing({
              ...EMPTY,
              order: rows.length,
              features: [{ label: "", included: true }],
            });
            setError("");
            setModalOpen(true);
          }}
        >
          + New Package
        </AdminButton>
      </div>

      {error && !modalOpen && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={[...rows].sort(
            (a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0),
          )}
          empty="No packages yet. Add your first coaching package."
          actions={(row) => (
            <>
              <AdminButton
                variant="ghost"
                onClick={() => {
                  setEditing(toForm(row));
                  setError("");
                  setModalOpen(true);
                }}
              >
                Edit
              </AdminButton>
              <AdminButton variant="danger" onClick={() => remove(row)}>
                Delete
              </AdminButton>
            </>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing?.id ? "Edit Package" : "New Package"}
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save package"}
            </AdminButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Package name">
                <TextInput
                  value={editing.name || ""}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Performance"
                />
              </Field>
              <Field label="Badge / tier">
                <TextInput
                  value={editing.tier || ""}
                  onChange={(e) => set({ tier: e.target.value })}
                  placeholder="e.g. Most Popular"
                />
              </Field>
            </div>

            <Field label="Tagline">
              <TextInput
                value={editing.tagline || ""}
                onChange={(e) => set({ tagline: e.target.value })}
                placeholder="Short line under the name"
              />
            </Field>

            <Field label="Description">
              <TextArea
                rows={3}
                value={editing.description || ""}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Who this package is for and what they get"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (AUD)">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.priceDollars || ""}
                  onChange={(e) => set({ priceDollars: e.target.value })}
                  placeholder="299"
                />
              </Field>
              <Field label="Billing period">
                <Select
                  value={editing.billingPeriod || "month"}
                  onChange={(e) => set({ billingPeriod: e.target.value })}
                >
                  {BILLING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort order">
                <TextInput
                  type="number"
                  value={String(editing.order ?? 0)}
                  onChange={(e) => set({ order: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Custom price display (optional)">
              <TextInput
                value={editing.priceDisplay || ""}
                onChange={(e) => set({ priceDisplay: e.target.value })}
                placeholder='e.g. "From $299" — leave blank to use price above'
              />
            </Field>

            <Field label="CTA button label">
              <TextInput
                value={editing.ctaLabel || ""}
                onChange={(e) => set({ ctaLabel: e.target.value })}
              />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.15em] text-steel">
                  Features
                </span>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-xs text-accent hover:underline"
                >
                  + Add feature
                </button>
              </div>
              <div className="space-y-2">
                {(editing.features || []).map((f, i) => (
                  <div key={f.id || i} className="flex items-center gap-2">
                    <TextInput
                      value={f.label}
                      onChange={(e) =>
                        setFeature(i, { label: e.target.value })
                      }
                      placeholder="Feature description"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFeature(i, { included: !f.included })
                      }
                      className={`flex-none rounded-lg px-3 py-2 text-xs ${
                        f.included
                          ? "bg-accent/15 text-accent"
                          : "bg-graphite text-steel"
                      }`}
                    >
                      {f.included ? "Included" : "Excluded"}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFeature(i, -1)}
                      className="flex-none text-steel hover:text-off-white"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFeature(i, 1)}
                      className="flex-none text-steel hover:text-off-white"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      aria-label="Remove"
                      className="flex-none text-steel hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <Toggle
                checked={Boolean(editing.featured)}
                onChange={(v) => set({ featured: v })}
                label="Highlight as featured"
              />
              <Toggle
                checked={editing.published !== false}
                onChange={(v) => set({ published: v })}
                label="Published on website"
              />
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
