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
import { DEFAULT_APPLY_FORM, mergeApplyFormConfig } from "@/lib/apply-form";
import { DEFAULT_PHOTO_RAIL, mergePhotoRail } from "@/lib/gallery";
import { adminGetApplyForm, adminGetSite, adminUpdateSite } from "@/lib/api/newphase";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type {
  ApplyFormConfig,
  ApplyFormField,
  GallerySlide,
  SiteSettings,
} from "@/types/newphase";

export default function AdminSettingsPage() {
  const [site, setSite] = useState<SiteSettings>({});
  const [applyForm, setApplyForm] = useState<ApplyFormConfig>(DEFAULT_APPLY_FORM);
  const [photoRail, setPhotoRail] = useState<GallerySlide[]>(DEFAULT_PHOTO_RAIL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [siteData, formData] = await Promise.all([
          adminGetSite(),
          adminGetApplyForm(),
        ]);
        if (!active) return;
        if (siteData) {
          setSite(siteData);
          setPhotoRail(mergePhotoRail(siteData.photoRail));
        }
        setApplyForm(formData);
      } catch {
        /* new site — start with defaults */
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

  const patchApply = (patch: Partial<ApplyFormConfig>) =>
    setApplyForm((f) => ({ ...f, ...patch }));

  const patchField = (key: ApplyFormField["key"], patch: Partial<ApplyFormField>) =>
    setApplyForm((f) => ({
      ...f,
      fields: f.fields.map((field) =>
        field.key === key ? { ...field, ...patch } : field,
      ),
    }));

  const patchSlide = (id: string, patch: Partial<GallerySlide>) =>
    setPhotoRail((slides) =>
      slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );

  const addSlide = () =>
    setPhotoRail((slides) => [
      ...slides,
      { id: `slide-${Date.now()}`, src: "", label: "" },
    ]);

  const removeSlide = (id: string) =>
    setPhotoRail((slides) => slides.filter((s) => s.id !== id));

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminUpdateSite({
        ...site,
        applyForm: mergeApplyFormConfig(applyForm),
        photoRail: mergePhotoRail(
          photoRail.filter((s) => Boolean(s.src?.trim())),
        ),
      });
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
      <div className="max-w-3xl space-y-8">
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

        <section className="rounded-2xl surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-wide text-off-white">
                Experience photo rail
              </h2>
              <p className="mt-1 text-sm text-steel">
                Scrolls under the &ldquo;Everything you need in one system&rdquo;
                cards on the homepage.
              </p>
            </div>
            <AdminButton variant="ghost" onClick={addSlide}>
              + Add photo
            </AdminButton>
          </div>
          <div className="mt-5 space-y-4">
            {photoRail.map((slide, i) => (
              <div
                key={slide.id}
                className="rounded-xl border border-[color:var(--edge)] bg-near-black/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-off-white">Photo {i + 1}</p>
                  <AdminButton
                    variant="danger"
                    onClick={() => removeSlide(slide.id)}
                  >
                    Remove
                  </AdminButton>
                </div>
                <ImageUploadField
                  label="Image"
                  value={slide.src || undefined}
                  onChange={(url) => patchSlide(slide.id, { src: url })}
                />
                <div className="mt-3">
                  <Field label="Label (optional)">
                    <TextInput
                      value={slide.label || ""}
                      onChange={(e) =>
                        patchSlide(slide.id, { label: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
            {photoRail.length === 0 && (
              <p className="text-sm text-steel">
                No photos yet. Add photos to show the rail on the homepage.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl surface p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            Apply form
          </h2>
          <p className="mt-1 text-sm text-steel">
            Edit the public application page copy and field labels. Name, email,
            and consent always stay required.
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Page eyebrow">
                <TextInput
                  value={applyForm.pageEyebrow}
                  onChange={(e) => patchApply({ pageEyebrow: e.target.value })}
                />
              </Field>
              <Field label="Submit button">
                <TextInput
                  value={applyForm.submitLabel}
                  onChange={(e) => patchApply({ submitLabel: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Page title">
              <TextInput
                value={applyForm.pageTitle}
                onChange={(e) => patchApply({ pageTitle: e.target.value })}
              />
            </Field>
            <Field label="Page intro">
              <TextArea
                rows={3}
                value={applyForm.pageIntro}
                onChange={(e) => patchApply({ pageIntro: e.target.value })}
              />
            </Field>
            <Field label="Consent text">
              <TextArea
                rows={2}
                value={applyForm.consentLabel}
                onChange={(e) => patchApply({ consentLabel: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Success title">
                <TextInput
                  value={applyForm.successTitle}
                  onChange={(e) => patchApply({ successTitle: e.target.value })}
                />
              </Field>
              <Field label="Success message">
                <TextArea
                  rows={2}
                  value={applyForm.successBody}
                  onChange={(e) => patchApply({ successBody: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-steel">
              Fields
            </h3>
            {applyForm.fields.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-[color:var(--edge)] bg-near-black/40 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-off-white">
                    {field.key}
                    {field.locked ? (
                      <span className="ml-2 text-xs text-steel">(required)</span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {!field.locked && (
                      <Toggle
                        checked={field.visible}
                        onChange={(v) => patchField(field.key, { visible: v })}
                        label="Visible"
                      />
                    )}
                    {!field.locked && (
                      <Toggle
                        checked={field.required}
                        onChange={(v) => patchField(field.key, { required: v })}
                        label="Required"
                      />
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Label">
                    <TextInput
                      value={field.label}
                      onChange={(e) =>
                        patchField(field.key, { label: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Placeholder">
                    <TextInput
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        patchField(field.key, { placeholder: e.target.value })
                      }
                    />
                  </Field>
                </div>
                {field.type === "select" && (
                  <div className="mt-3">
                    <Field label="Options (one per line)">
                      <TextArea
                        rows={4}
                        value={(field.options || []).join("\n")}
                        onChange={(e) =>
                          patchField(field.key, {
                            options: e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}
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
