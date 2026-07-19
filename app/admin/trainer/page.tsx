"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  Field,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/ui";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DEFAULT_COACHES, mergeCoaches } from "@/lib/coaches";
import { adminGetSite, adminUpdateSite } from "@/lib/api/newphase";
import type { Coach } from "@/types/newphase";

export default function AdminTrainerPage() {
  const [coaches, setCoaches] = useState<Coach[]>(DEFAULT_COACHES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const site = await adminGetSite();
        if (active) setCoaches(mergeCoaches(site?.coaches));
      } catch {
        /* defaults */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const patch = (id: string, update: Partial<Coach>) =>
    setCoaches((list) =>
      list.map((c) => (c.id === id ? { ...c, ...update } : c)),
    );

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminUpdateSite({ coaches: mergeCoaches(coaches) });
      setMessage("Coach roster saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Trainer">
        <div className="h-96 animate-pulse rounded-2xl surface" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Trainer">
      <div className="max-w-3xl space-y-6">
        <p className="text-sm text-steel">
          Homepage and /trainers show visible coaches with a photo and name.
          Slot 3 is the optional third coach from the reference layout.
        </p>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {coaches.map((coach, index) => (
          <section key={coach.id} className="space-y-4 rounded-2xl surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl tracking-wide text-off-white">
                Coach slot {index + 1}
              </h2>
              <Toggle
                checked={coach.visible}
                onChange={(v) => patch(coach.id, { visible: v })}
                label="Visible"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <TextInput
                  value={coach.name}
                  onChange={(e) => patch(coach.id, { name: e.target.value })}
                  placeholder="Coach name"
                />
              </Field>
              <Field label="Role / title">
                <TextInput
                  value={coach.role}
                  onChange={(e) => patch(coach.id, { role: e.target.value })}
                  placeholder="e.g. Head Coach"
                />
              </Field>
            </div>
            <Field label="Profile URL slug">
              <TextInput
                value={coach.slug}
                onChange={(e) => patch(coach.id, { slug: e.target.value })}
              />
            </Field>
            <Field label="Bio">
              <TextArea
                rows={4}
                value={coach.bio}
                onChange={(e) => patch(coach.id, { bio: e.target.value })}
              />
            </Field>
            <ImageUploadField
              label="Photo (black background preferred)"
              value={coach.imageUrl || undefined}
              onChange={(url) => patch(coach.id, { imageUrl: url })}
            />
          </section>
        ))}

        <div className="flex items-center gap-4">
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save coaches"}
          </AdminButton>
          {message && <span className="text-sm text-accent">{message}</span>}
        </div>
      </div>
    </AdminShell>
  );
}
