import type { ApplyFormConfig, ApplyFormField, ApplyFormFieldKey } from "@/types/newphase";

export const APPLY_FORM_SETTING_KEY = "apply.form";

export const DEFAULT_APPLY_FORM: ApplyFormConfig = {
  pageEyebrow: "Apply",
  pageTitle: "Start your next phase",
  pageIntro:
    "Tell us about you and your goals. We keep spots limited so every client gets full attention — apply and we'll be in touch.",
  submitLabel: "Submit Application",
  consentLabel:
    "I consent to NewPhase Coaching contacting me about coaching. My details will not be shared.",
  successTitle: "Application received",
  successBody:
    "We'll review your goals and be in touch within 24–48 hours to map out your next phase.",
  fields: [
    {
      key: "name",
      label: "Full name",
      placeholder: "Jordan Smith",
      type: "text",
      required: true,
      visible: true,
      locked: true,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "you@email.com",
      type: "email",
      required: true,
      visible: true,
      locked: true,
    },
    {
      key: "phone",
      label: "Phone",
      placeholder: "Optional",
      type: "tel",
      required: false,
      visible: true,
    },
    {
      key: "packageId",
      label: "Package of interest",
      placeholder: "Not sure yet",
      type: "package",
      required: false,
      visible: true,
    },
    {
      key: "experience",
      label: "Training experience",
      placeholder: "Select one",
      type: "select",
      required: false,
      visible: true,
      options: [
        "Just getting started",
        "Some training experience",
        "Consistent for 1+ years",
        "Advanced / competitive",
      ],
    },
    {
      key: "goal",
      label: "Primary goal",
      placeholder:
        "e.g. Build muscle, improve body composition, get stronger",
      type: "text",
      required: false,
      visible: true,
    },
    {
      key: "challenge",
      label: "What are you struggling with?",
      placeholder:
        "Consistency, program design, nutrition, accountability...",
      type: "textarea",
      required: false,
      visible: true,
    },
    {
      key: "success",
      label: "What would success look like?",
      placeholder: "Describe the outcome you want from coaching.",
      type: "textarea",
      required: false,
      visible: true,
    },
    {
      key: "message",
      label: "Additional message",
      placeholder: "Anything else we should know?",
      type: "textarea",
      required: false,
      visible: true,
    },
  ],
};

const FIELD_KEYS = new Set<ApplyFormFieldKey>(
  DEFAULT_APPLY_FORM.fields.map((f) => f.key),
);

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function mergeField(
  defaults: ApplyFormField,
  incoming?: Partial<ApplyFormField>,
): ApplyFormField {
  if (!incoming) return { ...defaults, options: defaults.options?.slice() };
  const options =
    Array.isArray(incoming.options) && incoming.options.length > 0
      ? incoming.options.map(String).filter(Boolean)
      : defaults.options?.slice();

  return {
    key: defaults.key,
    label: asString(incoming.label, defaults.label),
    placeholder:
      incoming.placeholder !== undefined
        ? String(incoming.placeholder)
        : defaults.placeholder,
    type: defaults.type,
    required: defaults.locked
      ? true
      : incoming.required !== undefined
        ? Boolean(incoming.required)
        : defaults.required,
    visible:
      defaults.locked || incoming.visible === undefined
        ? defaults.visible
        : Boolean(incoming.visible),
    locked: defaults.locked,
    options,
  };
}

/** Merge stored config with defaults so missing keys never break the form. */
export function mergeApplyFormConfig(raw?: unknown): ApplyFormConfig {
  const input =
    raw && typeof raw === "object" ? (raw as Partial<ApplyFormConfig>) : {};
  const byKey = new Map<ApplyFormFieldKey, Partial<ApplyFormField>>();
  if (Array.isArray(input.fields)) {
    for (const field of input.fields) {
      if (field && FIELD_KEYS.has(field.key as ApplyFormFieldKey)) {
        byKey.set(field.key as ApplyFormFieldKey, field);
      }
    }
  }

  return {
    pageEyebrow: asString(input.pageEyebrow, DEFAULT_APPLY_FORM.pageEyebrow),
    pageTitle: asString(input.pageTitle, DEFAULT_APPLY_FORM.pageTitle),
    pageIntro: asString(input.pageIntro, DEFAULT_APPLY_FORM.pageIntro),
    submitLabel: asString(input.submitLabel, DEFAULT_APPLY_FORM.submitLabel),
    consentLabel: asString(input.consentLabel, DEFAULT_APPLY_FORM.consentLabel),
    successTitle: asString(input.successTitle, DEFAULT_APPLY_FORM.successTitle),
    successBody: asString(input.successBody, DEFAULT_APPLY_FORM.successBody),
    fields: DEFAULT_APPLY_FORM.fields.map((field) =>
      mergeField(field, byKey.get(field.key)),
    ),
  };
}

export function visibleApplyFields(config: ApplyFormConfig): ApplyFormField[] {
  return config.fields.filter((f) => f.visible !== false);
}
