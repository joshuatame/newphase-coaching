"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminButton, Field, TextArea, TextInput } from "@/components/admin/ui";
import { adminGetSite, adminUpdateSite } from "@/lib/api/newphase";
import type { SiteSettings } from "@/types/newphase";

export default function AdminSettingsPage() {
  const [site, setSite] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await adminGetSite();
        if (active && data) setSite(data);
      } catch {
        /* new site — start empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const set = (patch: Partial<SiteSettings>) =>
    setSite((s) => ({ ...s, ...patch }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminUpdateSite(site);
      setMessage("Settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Settings">
        <div className="h-96 animate-pulse rounded-2xl surface" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Settings">
      <div className="max-w-2xl space-y-8">
        <section className="rounded-2xl surface p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            Brand
          </h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Site name">
                <TextInput
                  value={site.name || ""}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </Field>
              <Field label="Tagline">
                <TextInput
                  value={site.tagline || ""}
                  onChange={(e) => set({ tagline: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <TextArea
                rows={3}
                value={site.description || ""}
                onChange={(e) => set({ description: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl surface p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            Hero
          </h2>
          <div className="mt-4 space-y-4">
            <Field label="Hero headline">
              <TextInput
                value={site.heroHeadline || ""}
                onChange={(e) => set({ heroHeadline: e.target.value })}
              />
            </Field>
            <Field label="Hero subline">
              <TextArea
                rows={2}
                value={site.heroSubline || ""}
                onChange={(e) => set({ heroSubline: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl surface p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            Contact & Social
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <TextInput
                value={site.email || ""}
                onChange={(e) => set({ email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={site.phone || ""}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </Field>
            <Field label="Instagram URL">
              <TextInput
                value={site.instagram || ""}
                onChange={(e) => set({ instagram: e.target.value })}
              />
            </Field>
            <Field label="TikTok URL">
              <TextInput
                value={site.tiktok || ""}
                onChange={(e) => set({ tiktok: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </AdminButton>
          {message && <span className="text-sm text-accent">{message}</span>}
          {error && <span className="text-sm text-red-300">{error}</span>}
        </div>
      </div>
    </AdminShell>
  );
}
