// Typed fetchers for the NewPhase Coaching API surface.
// Public endpoints are unauthenticated; admin endpoints require a bearer token.

import {
  apiFetch,
  APP_SLUG,
  setToken,
  clearToken,
  unwrapItem,
  unwrapList,
} from "./client";
import {
  APPLY_FORM_SETTING_KEY,
  mergeApplyFormConfig,
} from "@/lib/apply-form";
import type {
  ApplyFormConfig,
  AuthResponse,
  Client,
  DashboardStats,
  Enquiry,
  EnquiryPayload,
  Faq,
  MediaUploadResponse,
  Package,
  PackageFeature,
  Section,
  SiteSettingRow,
  SiteSettings,
  Testimonial,
} from "@/types/newphase";

const NP = "/newphase-coaching";

/** Flat SiteSettings fields ↔ NewphaseSiteSetting keys. */
const SITE_FLAT_KEYS: Array<{
  flat: keyof SiteSettings;
  key: string;
  group: string;
  label: string;
  valueType: string;
}> = [
  {
    flat: "name",
    key: "business.name",
    group: "general",
    label: "Business name",
    valueType: "string",
  },
  {
    flat: "tagline",
    key: "business.tagline",
    group: "general",
    label: "Tagline",
    valueType: "string",
  },
  {
    flat: "description",
    key: "business.description",
    group: "general",
    label: "Description",
    valueType: "string",
  },
  {
    flat: "email",
    key: "contact.email",
    group: "contact",
    label: "Contact email",
    valueType: "string",
  },
  {
    flat: "phone",
    key: "contact.phone",
    group: "contact",
    label: "Contact phone",
    valueType: "string",
  },
  {
    flat: "instagram",
    key: "social.instagram",
    group: "social",
    label: "Instagram URL",
    valueType: "url",
  },
  {
    flat: "facebook",
    key: "social.facebook",
    group: "social",
    label: "Facebook URL",
    valueType: "url",
  },
  {
    flat: "tiktok",
    key: "social.tiktok",
    group: "social",
    label: "TikTok URL",
    valueType: "url",
  },
];

function settingsByKeyFromRows(
  rows: SiteSettingRow[],
): Record<string, unknown> {
  const byKey: Record<string, unknown> = {};
  for (const row of rows) byKey[row.key] = row.value;
  return byKey;
}

function flatSiteFromByKey(byKey: Record<string, unknown>): SiteSettings {
  const site: SiteSettings = {};
  for (const map of SITE_FLAT_KEYS) {
    const value = byKey[map.key];
    if (typeof value === "string") {
      (site as Record<string, unknown>)[map.flat] = value;
    }
  }
  if (byKey[APPLY_FORM_SETTING_KEY] !== undefined) {
    site.applyForm = mergeApplyFormConfig(byKey[APPLY_FORM_SETTING_KEY]);
  }
  return site;
}

/** Map Prisma client fields → frontend Client shape. */
function normalizeClient(raw: Client): Client {
  const r = raw as Client & {
    publicName?: string;
    resultSummary?: string;
    heroImageUrl?: string;
    thumbnailUrl?: string;
    sortOrder?: number;
  };
  return {
    ...raw,
    name: raw.name || r.publicName || "",
    result: raw.result || r.resultSummary || "",
    imageUrl: raw.imageUrl || r.heroImageUrl || r.thumbnailUrl || undefined,
    order: raw.order ?? r.sortOrder ?? 0,
  };
}

/** Map enquiry row → frontend Enquiry shape. */
function normalizeEnquiry(raw: Enquiry): Enquiry {
  const fullName = raw.fullName || raw.name;
  const statusRaw = String(raw.status || "NEW").toLowerCase();
  const statusMap: Record<string, Enquiry["status"]> = {
    new: "new",
    contacted: "contacted",
    qualified: "contacted",
    converted: "converted",
    closed: "archived",
    archived: "archived",
  };
  return {
    ...raw,
    name: fullName || "",
    goal: raw.goal || raw.primaryGoal,
    experience: raw.experience || raw.trainingExperience,
    challenge: raw.challenge || raw.currentChallenge,
    success: raw.success || raw.successDefinition,
    status: statusMap[statusRaw] || "new",
  };
}

/** Frontend form → backend CreateClientDto */
function toClientDto(data: Partial<Client>) {
  return {
    publicName: data.name,
    headline: data.headline,
    summary: data.summary,
    story: data.story,
    category: data.category,
    resultSummary: data.result,
    heroImageUrl: data.imageUrl || data.afterImageUrl,
    beforeImageUrl: data.beforeImageUrl,
    afterImageUrl: data.afterImageUrl,
    thumbnailUrl: data.afterImageUrl || data.imageUrl,
    featured: data.featured,
    published: true,
    sortOrder: data.order,
  };
}

/* --------------------------------- Public -------------------------------- */

export async function getSite(): Promise<SiteSettings | null> {
  const res = await apiFetch<unknown>(`${NP}/site`);
  const data = unwrapItem<{
    settings?: SiteSettingRow[];
    settingsByKey?: Record<string, unknown>;
  }>(res);
  if (!data) return null;
  const byKey =
    data.settingsByKey ||
    (data.settings ? settingsByKeyFromRows(data.settings) : null);
  return byKey ? flatSiteFromByKey(byKey) : null;
}

export async function getApplyFormConfig(): Promise<ApplyFormConfig> {
  try {
    const site = await getSite();
    return mergeApplyFormConfig(site?.applyForm);
  } catch {
    return mergeApplyFormConfig();
  }
}

export async function getSections(): Promise<Section[]> {
  const res = await apiFetch<unknown>(`${NP}/sections`);
  return unwrapList<Section>(res);
}

export async function getClients(params?: {
  category?: string;
  featured?: boolean;
}): Promise<Client[]> {
  const res = await apiFetch<unknown>(`${NP}/clients`, { query: params });
  return unwrapList<Client>(res).map(normalizeClient);
}

export async function getClient(idOrSlug: string): Promise<Client | null> {
  const res = await apiFetch<unknown>(`${NP}/clients/${idOrSlug}`);
  const item = unwrapItem<Client>(res);
  return item ? normalizeClient(item) : null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await apiFetch<unknown>(`${NP}/testimonials`);
  return unwrapList<Testimonial>(res);
}

function normalizePackage(raw: Package): Package {
  const priceLabel =
    raw.priceLabel ||
    raw.priceDisplay ||
    (raw.priceCents != null
      ? `$${(raw.priceCents / 100).toFixed(raw.priceCents % 100 === 0 ? 0 : 2)}`
      : raw.price != null
        ? `$${raw.price}`
        : undefined);
  const interval =
    raw.interval ||
    (raw.billingPeriod ? `/${raw.billingPeriod}` : undefined);
  const tier = raw.tier || raw.badgeText || raw.eyebrow || undefined;
  const features = (raw.features || []).map((f, i) => ({
    id: f.id,
    label: f.label,
    included: f.included !== false,
    detail: f.detail || f.description,
    description: f.description || f.detail,
    sortOrder: f.sortOrder ?? i,
  }));
  return {
    ...raw,
    priceLabel,
    interval,
    tier: tier || undefined,
    order: raw.order ?? raw.sortOrder ?? 0,
    features,
  };
}

/** Frontend package form → backend Create/UpdatePackageDto */
function toPackageDto(data: Partial<Package>) {
  const dollars = data.price;
  let priceCents = data.priceCents;
  if (priceCents == null && dollars != null && !Number.isNaN(Number(dollars))) {
    priceCents = Math.round(Number(dollars) * 100);
  }
  // If admin typed a display like "From $299", keep it; else derive from cents
  const priceDisplay =
    data.priceDisplay ||
    data.priceLabel ||
    (priceCents != null
      ? `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`
      : undefined);

  const billingPeriod = (
    data.billingPeriod ||
    (data.interval ? String(data.interval).replace(/^\//, "") : undefined) ||
    undefined
  );

  return {
    name: data.name,
    slug: data.slug,
    eyebrow: data.eyebrow || data.tier,
    tagline: data.tagline,
    description:
      data.description ||
      data.tagline ||
      `${data.name || "Package"} coaching programme`,
    priceCents: priceCents ?? undefined,
    priceDisplay,
    currency: data.currency || "AUD",
    billingPeriod,
    badgeText: data.badgeText || data.tier,
    ctaLabel: data.ctaLabel || "Get Started",
    ctaHref: "/apply/",
    featured: data.featured ?? false,
    active: true,
    published: data.published !== false,
    sortOrder: data.order ?? data.sortOrder ?? 0,
  };
}

export async function getPackages(): Promise<Package[]> {
  const res = await apiFetch<unknown>(`${NP}/packages`);
  return unwrapList<Package>(res).map(normalizePackage);
}

export async function getPackage(idOrSlug: string): Promise<Package | null> {
  const res = await apiFetch<unknown>(`${NP}/packages/${idOrSlug}`);
  const item = unwrapItem<Package>(res);
  return item ? normalizePackage(item) : null;
}

export async function getFaqs(): Promise<Faq[]> {
  const res = await apiFetch<unknown>(`${NP}/faqs`);
  return unwrapList<Faq>(res);
}

export async function submitEnquiry(
  payload: EnquiryPayload,
): Promise<{ ok: boolean }> {
  const body = {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone || undefined,
    packageId: payload.packageId || undefined,
    primaryGoal: payload.goal || undefined,
    trainingExperience: payload.experience || undefined,
    currentChallenge: payload.challenge || undefined,
    successDefinition: payload.success || undefined,
    message: payload.message || undefined,
    consent: payload.consent === true,
    source: payload.source || "website",
  };
  await apiFetch<unknown>(`${NP}/enquiries`, {
    method: "POST",
    body,
  });
  return { ok: true };
}

/* ---------------------------------- Auth --------------------------------- */

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse & {
    tokens?: { accessToken?: string };
    accessToken?: string;
  }>(`/auth/login`, {
    method: "POST",
    body: { email, password, appSlug: APP_SLUG },
  });
  const token =
    res?.token || res?.accessToken || res?.tokens?.accessToken || null;
  if (token) setToken(token);
  return { ...res, token: token || res?.token };
}

export function logout(): void {
  clearToken();
}

/* --------------------------------- Admin --------------------------------- */

export async function getDashboard(): Promise<DashboardStats> {
  const res = await apiFetch<unknown>(`${NP}/admin/dashboard`, { auth: true });
  return (unwrapItem<DashboardStats>(res) as DashboardStats) || {};
}

/* --- Admin: Clients --- */
export async function adminGetClients(): Promise<Client[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/clients`, { auth: true });
  return unwrapList<Client>(res).map(normalizeClient);
}
export async function adminCreateClient(
  data: Partial<Client>,
): Promise<Client | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/clients`, {
    method: "POST",
    body: toClientDto(data),
    auth: true,
  });
  const item = unwrapItem<Client>(res);
  return item ? normalizeClient(item) : null;
}
export async function adminUpdateClient(
  id: string,
  data: Partial<Client>,
): Promise<Client | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/clients/${id}`, {
    method: "PUT",
    body: toClientDto(data),
    auth: true,
  });
  const item = unwrapItem<Client>(res);
  return item ? normalizeClient(item) : null;
}
export async function adminDeleteClient(id: string): Promise<void> {
  await apiFetch<unknown>(`${NP}/admin/clients/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/* --- Admin: Testimonials --- */
export async function adminGetTestimonials(): Promise<Testimonial[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/testimonials`, {
    auth: true,
  });
  return unwrapList<Testimonial>(res);
}
export async function adminCreateTestimonial(
  data: Partial<Testimonial>,
): Promise<Testimonial | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/testimonials`, {
    method: "POST",
    body: data,
    auth: true,
  });
  return unwrapItem<Testimonial>(res);
}
export async function adminUpdateTestimonial(
  id: string,
  data: Partial<Testimonial>,
): Promise<Testimonial | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/testimonials/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
  return unwrapItem<Testimonial>(res);
}
export async function adminDeleteTestimonial(id: string): Promise<void> {
  await apiFetch<unknown>(`${NP}/admin/testimonials/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/* --- Admin: Packages --- */
export async function adminGetPackages(): Promise<Package[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/packages`, { auth: true });
  return unwrapList<Package>(res).map(normalizePackage);
}

async function syncPackageFeatures(
  packageId: string,
  features: PackageFeature[],
) {
  const existingRes = await apiFetch<unknown>(
    `${NP}/admin/package-features`,
    { query: { packageId }, auth: true },
  );
  const existing = unwrapList<PackageFeature>(existingRes);
  const keptIds = new Set(
    features.map((f) => f.id).filter(Boolean) as string[],
  );

  // Delete removed features
  await Promise.all(
    existing
      .filter((f) => f.id && !keptIds.has(f.id))
      .map((f) =>
        apiFetch<unknown>(`${NP}/admin/package-features/${f.id}`, {
          method: "DELETE",
          auth: true,
        }),
      ),
  );

  // Upsert current features
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const label = f.label?.trim();
    if (!label) continue;
    const body = {
      packageId,
      label,
      description: f.detail || f.description,
      included: f.included !== false,
      sortOrder: f.sortOrder ?? i,
    };
    if (f.id && existing.some((e) => e.id === f.id)) {
      await apiFetch<unknown>(`${NP}/admin/package-features/${f.id}`, {
        method: "PUT",
        body,
        auth: true,
      });
    } else {
      await apiFetch<unknown>(`${NP}/admin/package-features`, {
        method: "POST",
        body,
        auth: true,
      });
    }
  }
}

export async function adminCreatePackage(
  data: Partial<Package>,
): Promise<Package | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/packages`, {
    method: "POST",
    body: toPackageDto(data),
    auth: true,
  });
  const created = unwrapItem<Package>(res);
  if (!created?.id) return created ? normalizePackage(created) : null;

  const features = (data.features || []).filter((f) => f.label?.trim());
  if (features.length) {
    await syncPackageFeatures(created.id, features);
  }
  const refreshed = await apiFetch<unknown>(
    `${NP}/admin/packages/${created.id}`,
    { auth: true },
  );
  const item = unwrapItem<Package>(refreshed);
  return item ? normalizePackage(item) : normalizePackage(created);
}

export async function adminUpdatePackage(
  id: string,
  data: Partial<Package>,
): Promise<Package | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/packages/${id}`, {
    method: "PUT",
    body: toPackageDto(data),
    auth: true,
  });
  const updated = unwrapItem<Package>(res);
  if (data.features) {
    await syncPackageFeatures(
      id,
      data.features.filter((f) => f.label?.trim()),
    );
  }
  const refreshed = await apiFetch<unknown>(`${NP}/admin/packages/${id}`, {
    auth: true,
  });
  const item = unwrapItem<Package>(refreshed);
  return item
    ? normalizePackage(item)
    : updated
      ? normalizePackage(updated)
      : null;
}

export async function adminDeletePackage(id: string): Promise<void> {
  await apiFetch<unknown>(`${NP}/admin/packages/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/* --- Admin: FAQs --- */
export async function adminGetFaqs(): Promise<Faq[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/faqs`, { auth: true });
  return unwrapList<Faq>(res);
}
export async function adminCreateFaq(
  data: Partial<Faq>,
): Promise<Faq | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/faqs`, {
    method: "POST",
    body: data,
    auth: true,
  });
  return unwrapItem<Faq>(res);
}
export async function adminUpdateFaq(
  id: string,
  data: Partial<Faq>,
): Promise<Faq | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/faqs/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
  return unwrapItem<Faq>(res);
}
export async function adminDeleteFaq(id: string): Promise<void> {
  await apiFetch<unknown>(`${NP}/admin/faqs/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/* --- Admin: Sections / Content --- */
export async function adminGetSections(): Promise<Section[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/sections`, { auth: true });
  return unwrapList<Section>(res);
}
export async function adminUpdateSection(
  id: string,
  data: Partial<Section>,
): Promise<Section | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/sections/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
  return unwrapItem<Section>(res);
}

/* --- Admin: Site settings --- */
export async function adminListSettings(): Promise<SiteSettingRow[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/settings`, { auth: true });
  return unwrapList<SiteSettingRow>(res);
}

async function adminUpsertSetting(
  input: {
    key: string;
    group: string;
    label: string;
    value: unknown;
    valueType: string;
    isPublic?: boolean;
    sortOrder?: number;
  },
  existingRows?: SiteSettingRow[],
): Promise<SiteSettingRow | null> {
  const rows = existingRows ?? (await adminListSettings());
  const existing = rows.find((s) => s.key === input.key);
  if (existing) {
    const res = await apiFetch<unknown>(`${NP}/admin/settings/${existing.id}`, {
      method: "PUT",
      auth: true,
      body: {
        group: input.group,
        label: input.label,
        value: input.value,
        valueType: input.valueType,
        isPublic: input.isPublic ?? true,
        sortOrder: input.sortOrder,
      },
    });
    return unwrapItem<SiteSettingRow>(res);
  }
  const res = await apiFetch<unknown>(`${NP}/admin/settings`, {
    method: "POST",
    auth: true,
    body: {
      key: input.key,
      group: input.group,
      label: input.label,
      value: input.value,
      valueType: input.valueType,
      isPublic: input.isPublic ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return unwrapItem<SiteSettingRow>(res);
}

export async function adminGetSite(): Promise<SiteSettings | null> {
  const rows = await adminListSettings();
  return flatSiteFromByKey(settingsByKeyFromRows(rows));
}

export async function adminUpdateSite(
  data: Partial<SiteSettings>,
): Promise<SiteSettings | null> {
  const rows = await adminListSettings();
  for (const map of SITE_FLAT_KEYS) {
    if (!(map.flat in data)) continue;
    const value = data[map.flat];
    if (value === undefined) continue;
    await adminUpsertSetting(
      {
        key: map.key,
        group: map.group,
        label: map.label,
        value: value ?? "",
        valueType: map.valueType,
        isPublic: true,
      },
      rows,
    );
  }

  if (data.applyForm !== undefined) {
    await adminUpsertSetting(
      {
        key: APPLY_FORM_SETTING_KEY,
        group: "apply",
        label: "Apply form",
        value: mergeApplyFormConfig(data.applyForm),
        valueType: "json",
        isPublic: true,
        sortOrder: 0,
      },
      rows,
    );
  }

  return adminGetSite();
}

export async function adminGetApplyForm(): Promise<ApplyFormConfig> {
  const site = await adminGetSite();
  return mergeApplyFormConfig(site?.applyForm);
}

export async function adminUpdateApplyForm(
  config: ApplyFormConfig,
): Promise<ApplyFormConfig> {
  const rows = await adminListSettings();
  await adminUpsertSetting(
    {
      key: APPLY_FORM_SETTING_KEY,
      group: "apply",
      label: "Apply form",
      value: mergeApplyFormConfig(config),
      valueType: "json",
      isPublic: true,
      sortOrder: 0,
    },
    rows,
  );
  return adminGetApplyForm();
}

/* --- Admin: Enquiries / Applications --- */
export async function adminGetEnquiries(): Promise<Enquiry[]> {
  const res = await apiFetch<unknown>(`${NP}/admin/enquiries`, { auth: true });
  return unwrapList<Enquiry>(res).map(normalizeEnquiry);
}
export async function adminUpdateEnquiry(
  id: string,
  data: Partial<Enquiry>,
): Promise<Enquiry | null> {
  const statusMap: Record<string, string> = {
    new: "NEW",
    contacted: "CONTACTED",
    converted: "CONVERTED",
    archived: "CLOSED",
  };
  const body: Record<string, unknown> = {};
  if (data.status) {
    body.status =
      statusMap[String(data.status).toLowerCase()] ||
      String(data.status).toUpperCase();
  }
  if (data.adminNotes != null) body.adminNotes = data.adminNotes;
  const res = await apiFetch<unknown>(`${NP}/admin/enquiries/${id}`, {
    method: "PATCH",
    body,
    auth: true,
  });
  const item = unwrapItem<Enquiry>(res);
  return item ? normalizeEnquiry(item) : null;
}
export async function adminDeleteEnquiry(id: string): Promise<void> {
  // Backend has no DELETE for enquiries — close instead.
  await adminUpdateEnquiry(id, { status: "archived" });
}

/* --- Admin: Media --- */
export async function adminGetMediaUploadUrl(input: {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  altText?: string;
}): Promise<MediaUploadResponse | null> {
  const res = await apiFetch<unknown>(`${NP}/admin/media/upload-url`, {
    method: "POST",
    body: input,
    auth: true,
  });
  const item = unwrapItem<MediaUploadResponse & { publicUrl?: string }>(res);
  if (!item) return null;
  return {
    ...item,
    fileUrl: item.fileUrl || item.publicUrl || "",
  };
}
