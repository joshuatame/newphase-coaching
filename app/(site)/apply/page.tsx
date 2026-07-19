"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import {
  DEFAULT_APPLY_FORM,
  mergeApplyFormConfig,
  visibleApplyFields,
} from "@/lib/apply-form";
import { getApplyFormConfig, getPackages, submitEnquiry } from "@/lib/api/newphase";
import { FALLBACK_PACKAGES } from "@/lib/fallbacks";
import type {
  ApplyFormConfig,
  ApplyFormField,
  EnquiryPayload,
  Package,
} from "@/types/newphase";

function ApplyForm({ config }: { config: ApplyFormConfig }) {
  const params = useSearchParams();
  const { data: packages } = useAsync<Package[]>(getPackages, FALLBACK_PACKAGES);
  const fields = useMemo(() => visibleApplyFields(config), [config]);

  const [form, setForm] = useState<EnquiryPayload>({
    name: "",
    email: "",
    phone: "",
    packageId: "",
    goal: "",
    experience: "",
    challenge: "",
    success: "",
    message: "",
    consent: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const preselect = params.get("package");
    if (preselect) {
      setForm((f) => ({ ...f, packageId: preselect }));
    }
  }, [params]);

  const update = (key: keyof EnquiryPayload, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (!form.consent) {
      setStatus("error");
      setErrorMsg("Please confirm you consent to be contacted.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      await submitEnquiry(form);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  if (status === "done") {
    return (
      <Reveal>
        <div className="mx-auto max-w-xl rounded-3xl surface-carbon px-8 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-off-white">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="display-lg mt-6 text-3xl text-off-white">
            {config.successTitle}
          </h2>
          <p className="mt-3 text-steel">
            Thanks {form.name.split(" ")[0]}. {config.successBody}
          </p>
          <Link href="/" className="btn btn-ghost mt-8">
            Back to Home
          </Link>
        </div>
      </Reveal>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-[color:var(--edge-strong)] bg-near-black px-4 py-3.5 text-off-white placeholder:text-steel/60 transition-colors focus:border-accent focus:outline-none";

  const renderField = (field: ApplyFormField) => {
    const label = (
      <label
        htmlFor={field.key}
        className="mb-2 block text-sm text-soft-silver"
      >
        {field.label}
        {field.required ? <span className="text-accent"> *</span> : null}
      </label>
    );

    if (field.type === "package") {
      return (
        <div key={field.key}>
          {label}
          <select
            id={field.key}
            value={form.packageId || ""}
            required={field.required}
            onChange={(e) => update("packageId", e.target.value)}
            className={inputCls}
          >
            <option value="">{field.placeholder || "Not sure yet"}</option>
            {packages.map((p) => (
              <option key={p.id} value={p.slug || p.id}>
                {p.name}
                {p.priceLabel ? ` — ${p.priceLabel}${p.interval || ""}` : ""}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.key}>
          {label}
          <select
            id={field.key}
            value={(form[field.key] as string) || ""}
            required={field.required}
            onChange={(e) => update(field.key, e.target.value)}
            className={inputCls}
          >
            <option value="">{field.placeholder || "Select one"}</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key}>
          {label}
          <textarea
            id={field.key}
            rows={3}
            required={field.required}
            value={(form[field.key] as string) || ""}
            onChange={(e) => update(field.key, e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        {label}
        <input
          id={field.key}
          type={field.type === "email" || field.type === "tel" ? field.type : "text"}
          required={field.required}
          value={(form[field.key] as string) || ""}
          onChange={(e) => update(field.key, e.target.value)}
          className={inputCls}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  // Pair name+email and phone+package when both visible for a tighter layout
  const paired = new Set<string>();
  const blocks: ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (paired.has(field.key)) continue;

    const next = fields[i + 1];
    const canPair =
      (field.key === "name" && next?.key === "email") ||
      (field.key === "phone" && next?.key === "packageId");

    if (canPair && next) {
      paired.add(field.key);
      paired.add(next.key);
      blocks.push(
        <div key={`${field.key}-${next.key}`} className="grid gap-6 sm:grid-cols-2">
          {renderField(field)}
          {renderField(next)}
        </div>,
      );
      continue;
    }

    blocks.push(renderField(field));
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      {blocks}

      <label className="flex items-start gap-3 rounded-xl border border-[color:var(--edge)] bg-near-black/60 px-4 py-3 text-sm text-soft-silver">
        <input
          type="checkbox"
          checked={Boolean(form.consent)}
          onChange={(e) =>
            setForm((f) => ({ ...f, consent: e.target.checked }))
          }
          className="mt-1 h-4 w-4 accent-[color:var(--accent)]"
          required
        />
        <span>{config.consentLabel}</span>
      </label>

      {status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : config.submitLabel}
      </button>
    </form>
  );
}

function ApplyPageContent() {
  const { data: config } = useAsync(getApplyFormConfig, DEFAULT_APPLY_FORM);
  const merged = mergeApplyFormConfig(config);

  return (
    <>
      <PageHeader
        eyebrow={merged.pageEyebrow}
        title={merged.pageTitle}
        intro={merged.pageIntro}
      />
      <section className="section-pad !pt-0">
        <div className="container-np">
          <Suspense
            fallback={
              <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl surface" />
            }
          >
            <ApplyForm config={merged} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

export default function ApplyPage() {
  return <ApplyPageContent />;
}
