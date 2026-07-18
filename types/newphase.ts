// Entity + payload types for the NewPhase Coaching site & admin.

export interface SiteSettings {
  id?: string;
  name?: string;
  tagline?: string;
  description?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  logoUrl?: string;
  heroHeadline?: string;
  heroSubline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  [key: string]: unknown;
}

export interface Section {
  id: string;
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  eyebrow?: string;
  order?: number;
  imageUrl?: string;
  items?: SectionItem[];
  meta?: Record<string, unknown>;
}

export interface SectionItem {
  id?: string;
  title?: string;
  body?: string;
  icon?: string;
  imageUrl?: string;
  value?: string;
  label?: string;
}

export interface Client {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  tags?: string[];
  headline?: string;
  story?: string;
  summary?: string;
  durationWeeks?: number;
  result?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  imageUrl?: string;
  featured?: boolean;
  stats?: { label: string; value: string }[];
  order?: number;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  rating?: number;
  imageUrl?: string;
  clientId?: string;
  result?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
}

export interface PackageFeature {
  id?: string;
  label: string;
  included: boolean;
  detail?: string;
  description?: string;
  sortOrder?: number;
}

export interface Package {
  id: string;
  name: string;
  slug?: string;
  tier?: string;
  eyebrow?: string;
  badgeText?: string | null;
  tagline?: string;
  description?: string;
  price?: number;
  priceCents?: number | null;
  priceLabel?: string;
  priceDisplay?: string | null;
  interval?: string;
  billingPeriod?: string | null;
  currency?: string;
  features?: PackageFeature[];
  highlights?: string[];
  featured?: boolean;
  published?: boolean;
  ctaLabel?: string;
  order?: number;
  sortOrder?: number;
  createdAt?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface EnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  packageId?: string;
  packageName?: string;
  goal?: string;
  experience?: string;
  challenge?: string;
  success?: string;
  message?: string;
  consent?: boolean;
  source?: string;
}

export interface Enquiry extends EnquiryPayload {
  id: string;
  status?:
    | "new"
    | "contacted"
    | "converted"
    | "archived"
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "CONVERTED"
    | "CLOSED";
  fullName?: string;
  primaryGoal?: string;
  trainingExperience?: string;
  currentChallenge?: string;
  successDefinition?: string;
  adminNotes?: string;
  createdAt?: string;
}

export interface MediaUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  publicUrl?: string;
  fields?: Record<string, string>;
  method?: string;
}

export interface DashboardStats {
  clients?: number;
  testimonials?: number;
  packages?: number;
  enquiries?: number;
  newEnquiries?: number;
  recentEnquiries?: Enquiry[];
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
}
