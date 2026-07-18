"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Field,
  Modal,
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

const EMPTY: Partial<Package> = {
  name: "",
  tier: "",
  tagline: "",
  priceLabel: "",
  interval: "/mo",
  ctaLabel: "Get Started",
  featured: false,
  order: 0,
  features: [{ label: "", included: true }],
};

export default function AdminPackagesPage() {
  const [rows, setRows] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Package> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetPackages());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<Package>) =>
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

  const save = async () => {
    if (!editing?.name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      ...editing,
      features: (editing.features || []).filter((f) => f.label.trim()),
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
    if (!confirm(`Delete package "${p.name}"?`)) return;
    await adminDeletePackage(p.id).catch(() => {});
    await load();
  };

  const columns: Column<Package>[] = [
    { key: "name", header: "Name" },
    { key: "priceLabel", header: "Price", render: (r) => `${r.priceLabel || "—"}${r.interval || ""}` },
    { key: "order", header: "Order", render: (r) => r.order ?? 0 },
    { key: "featured", header: "Featured", render: (r) => (r.featured ? "Yes" : "No") },
  ];

  return (
    <AdminShell title="Packages">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">
          Manage coaching packages, pricing and features.
        </p>
        <AdminButton
          onClick={() => {
            setEditing({ ...EMPTY, features: [{ label: "", included: true }] });
            setError("");
            setModalOpen(true);
          }}
        >
          + New Package
        </AdminButton>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No packages yet."
          actions={(row) => (
            <>
              <AdminButton
                variant="ghost"
                onClick={() => {
                  setEditing({
                    ...row,
                    features: row.features?.length
                      ? row.features
                      : [{ label: "", included: true }],
                  });
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
              {saving ? "Saving…" : "Save"}
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
              <Field label="Name">
                <TextInput
                  value={editing.name || ""}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </Field>
              <Field label="Tier label">
                <TextInput
                  value={editing.tier || ""}
                  onChange={(e) => set({ tier: e.target.value })}
                  placeholder="e.g. Most Popular"
                />
              </Field>
            </div>
            <Field label="Tagline">
              <TextArea
                rows={2}
                value={editing.tagline || ""}
                onChange={(e) => set({ tagline: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price label">
                <TextInput
                  value={editing.priceLabel || ""}
                  onChange={(e) => set({ priceLabel: e.target.value })}
                  placeholder="From $299"
                />
              </Field>
              <Field label="Interval">
                <TextInput
                  value={editing.interval || ""}
                  onChange={(e) => set({ interval: e.target.value })}
                  placeholder="/mo"
                />
              </Field>
              <Field label="Order">
                <TextInput
                  type="number"
                  value={String(editing.order ?? 0)}
                  onChange={(e) => set({ order: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="CTA label">
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
                  <div key={i} className="flex items-center gap-2">
                    <TextInput
                      value={f.label}
                      onChange={(e) => setFeature(i, { label: e.target.value })}
                      placeholder="Feature description"
                    />
                    <button
                      type="button"
                      onClick={() => setFeature(i, { included: !f.included })}
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

            <Toggle
              checked={Boolean(editing.featured)}
              onChange={(v) => set({ featured: v })}
              label="Highlight as featured package"
            />
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
