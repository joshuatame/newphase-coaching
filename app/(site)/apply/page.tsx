"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getPackages, submitEnquiry } from "@/lib/api/newphase";
import { FALLBACK_PACKAGES } from "@/lib/fallbacks";
import type { EnquiryPayload, Package } from "@/types/newphase";

const EXPERIENCE_LEVELS = [
  "Just getting started",
  "Some training experience",
  "Consistent for 1+ years",
  "Advanced / competitive",
];

function ApplyForm() {
  const params = useSearchParams();
  const { data: packages } = useAsync<Package[]>(getPackages, FALLBACK_PACKAGES);

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
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-obsidian">
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
            Application received
          </h2>
          <p className="mt-3 text-steel">
            Thanks {form.name.split(" ")[0]}. We&rsquo;ll review your goals and be
            in touch within 24&ndash;48 hours to map out your next phase.
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

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-soft-silver">
            Full name <span className="text-accent">*</span>
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputCls}
            placeholder="Jordan Smith"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-soft-silver">
            Email <span className="text-accent">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputCls}
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm text-soft-silver">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputCls}
            placeholder="Optional"
          />
        </div>
        <div>
          <label
            htmlFor="package"
            className="mb-2 block text-sm text-soft-silver"
          >
            Package of interest
          </label>
          <select
            id="package"
            value={form.packageId}
            onChange={(e) => update("packageId", e.target.value)}
            className={inputCls}
          >
            <option value="">Not sure yet</option>
            {packages.map((p) => (
              <option key={p.id} value={p.slug || p.id}>
                {p.name}
                {p.priceLabel ? ` — ${p.priceLabel}${p.interval || ""}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="experience"
          className="mb-2 block text-sm text-soft-silver"
        >
          Training experience
        </label>
        <select
          id="experience"
          value={form.experience}
          onChange={(e) => update("experience", e.target.value)}
          className={inputCls}
        >
          <option value="">Select one</option>
          {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="goal" className="mb-2 block text-sm text-soft-silver">
          Primary goal
        </label>
        <input
          id="goal"
          value={form.goal}
          onChange={(e) => update("goal", e.target.value)}
          className={inputCls}
          placeholder="e.g. Build muscle, improve body composition, get stronger"
        />
      </div>

      <div>
        <label
          htmlFor="challenge"
          className="mb-2 block text-sm text-soft-silver"
        >
          What are you struggling with?
        </label>
        <textarea
          id="challenge"
          rows={3}
          value={form.challenge}
          onChange={(e) => update("challenge", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Consistency, programming, nutrition, accountability..."
        />
      </div>

      <div>
        <label
          htmlFor="success"
          className="mb-2 block text-sm text-soft-silver"
        >
          What would success look like?
        </label>
        <textarea
          id="success"
          rows={3}
          value={form.success}
          onChange={(e) => update("success", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Describe the outcome you want from coaching."
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm text-soft-silver">
          Additional message
        </label>
        <textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder="Anything else we should know?"
        />
      </div>

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
        <span>
          I consent to NewPhase Coaching contacting me about coaching. My
          details will not be shared.
        </span>
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
        {status === "sending" ? "Sending…" : "Submit Application"}
      </button>
    </form>
  );
}

export default function ApplyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Apply"
        title="Start your next phase"
        intro="Tell us about you and your goals. We keep spots limited so every client gets full attention — apply and we'll be in touch."
      />
      <section className="section-pad !pt-0">
        <div className="container-np">
          <Suspense
            fallback={
              <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl surface" />
            }
          >
            <ApplyForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
