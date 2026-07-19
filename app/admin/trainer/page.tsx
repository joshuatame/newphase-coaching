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
import type { Coach, CoachCategory } from "@/types/newphase";

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

  const patchCategory = (
    coachId: string,
    index: number,
    update: Partial<CoachCategory>,
  ) =>
    setCoaches((list) =>
      list.map((c) => {
        if (c.id !== coachId) return c;
        const categories = [...(c.categories || [])];
        categories[index] = { ...categories[index], ...update };
        return { ...c, categories };
      }),
    );

  const addCategory = (coachId: string) =>
    setCoaches((list) =>
      list.map((c) =>
        c.id === coachId
          ? {
              ...c,
              categories: [
                ...(c.categories || []),
                { label: "New category", body: "" },
              ],
            }
          : c,
      ),
    );

  const removeCategory = (coachId: string, index: number) =>
    setCoaches((list) =>
      list.map((c) =>
        c.id === coachId
          ? {
              ...c,
              categories: (c.categories || []).filter((_, i) => i !== index),
            }
          : c,
      ),
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
          Profile pages use hero-style names (first white, last red) with photo
          on the left and category blocks on the right.
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
              <Field label="Full name (last word shows in red)">
                <TextInput
                  value={coach.name}
                  onChange={(e) => patch(coach.id, { name: e.target.value })}
                  placeholder="Coach Siegwalt"
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

            <div className="border-t border-[color:var(--edge)] pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs uppercase tracking-[0.2em] text-steel">
                  Profile categories
                </h3>
                <AdminButton
                  variant="ghost"
                  onClick={() => addCategory(coach.id)}
                >
                  + Add
                </AdminButton>
              </div>
              <div className="space-y-3">
                {(coach.categories || []).map((cat, i) => (
                  <div
                    key={`${coach.id}-cat-${i}`}
                    className="rounded-xl border border-[color:var(--edge)] bg-near-black/40 p-4"
                  >
                    <div className="mb-2 flex justify-end">
                      <AdminButton
                        variant="danger"
                        onClick={() => removeCategory(coach.id, i)}
                      >
                        Remove
                      </AdminButton>
                    </div>
                    <Field label="Category title">
                      <TextInput
                        value={cat.label}
                        onChange={(e) =>
                          patchCategory(coach.id, i, { label: e.target.value })
                        }
                        placeholder="Achievements"
                      />
                    </Field>
                    <div className="mt-3">
                      <Field label="Text">
                        <TextArea
                          rows={3}
                          value={cat.body}
                          onChange={(e) =>
                            patchCategory(coach.id, i, { body: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
