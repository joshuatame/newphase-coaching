"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminButton, Field, TextArea, TextInput } from "@/components/admin/ui";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  adminGetTrainerSection,
  adminUpdateSection,
} from "@/lib/api/newphase";
import { apiFetch } from "@/lib/api/client";
import type { Section } from "@/types/newphase";

const EMPTY: Partial<Section> = {
  key: "trainer",
  eyebrow: "Your Coach",
  title: "Meet the NewPhase coach",
  subtitle: "",
  body: "",
  imageUrl: "",
  ctaLabel: "Apply for coaching",
  ctaHref: "/apply/",
};

export default function AdminTrainerPage() {
  const [form, setForm] = useState<Partial<Section>>(EMPTY);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      let trainer = await adminGetTrainerSection();
      if (!trainer) {
        await apiFetch("/newphase-coaching/admin/sections", {
          method: "POST",
          auth: true,
          body: {
            page: "home",
            sectionKey: "trainer",
            eyebrow: EMPTY.eyebrow,
            title: EMPTY.title,
            body: "Coach bio goes here.",
            ctaLabel: EMPTY.ctaLabel,
            ctaHref: EMPTY.ctaHref,
            sortOrder: 2,
            visible: true,
          },
        });
        trainer = await adminGetTrainerSection();
      }
      if (trainer) {
        setSectionId(trainer.id);
        setForm({
          eyebrow: trainer.eyebrow || "",
          title: trainer.title || "",
          subtitle: trainer.subtitle || "",
          body: trainer.body || "",
          imageUrl: trainer.imageUrl || "",
          ctaLabel: trainer.ctaLabel || "Apply for coaching",
          ctaHref: trainer.ctaHref || "/apply/",
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trainer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<Section>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!sectionId) {
      setError("Trainer section is missing. Try refreshing.");
      return;
    }
    if (!form.title?.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminUpdateSection(sectionId, form);
      setMessage("Trainer profile saved.");
      await load();
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
      <div className="max-w-2xl space-y-6">
        <p className="text-sm text-steel">
          This profile appears on the homepage after the client photo carousel.
        </p>

        <section className="space-y-4 rounded-2xl surface p-6">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <Field label="Eyebrow">
            <TextInput
              value={form.eyebrow || ""}
              onChange={(e) => set({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Name / title">
            <TextInput
              value={form.title || ""}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Role / subtitle">
            <TextInput
              value={form.subtitle || ""}
              onChange={(e) => set({ subtitle: e.target.value })}
              placeholder="e.g. Head Coach"
            />
          </Field>
          <Field label="Bio">
            <TextArea
              rows={6}
              value={form.body || ""}
              onChange={(e) => set({ body: e.target.value })}
            />
          </Field>
          <ImageUploadField
            label="Profile photo"
            value={form.imageUrl}
            onChange={(url) => set({ imageUrl: url })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA label">
              <TextInput
                value={form.ctaLabel || ""}
                onChange={(e) => set({ ctaLabel: e.target.value })}
              />
            </Field>
            <Field label="CTA link">
              <TextInput
                value={form.ctaHref || ""}
                onChange={(e) => set({ ctaHref: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Trainer"}
          </AdminButton>
          {message && <span className="text-sm text-accent">{message}</span>}
        </div>
      </div>
    </AdminShell>
  );
}
