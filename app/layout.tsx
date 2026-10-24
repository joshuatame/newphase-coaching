import WebsiteAnalyticsScript from "next/script";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  display: "swap",
});

const SITE_NAME = "NewPhase Coaching";
const analyticsBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const analyticsPaths = ["/", "/trainers", "/packages", "/testimonials"]
  .map((path) => analyticsBasePath + (path === "/" ? (analyticsBasePath ? "" : "/") : path)).join(",");
const SITE_DESC =
  "Personalised online coaching that builds your next phase — bespoke training, nutrition and accountability engineered around your life.";

export const metadata: Metadata = {
  metadataBase: new URL("https://newphase-coaching.com"),
  title: {
    default: "NewPhase Coaching | Personalised Online Coaching",
    template: "%s | NewPhase Coaching",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "online coaching",
    "personal training",
    "fitness coaching",
    "nutrition coaching",
    "body transformation",
    "NewPhase Coaching",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "NewPhase Coaching | Personalised Online Coaching",
    description: SITE_DESC,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewPhase Coaching | Personalised Online Coaching",
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2 focus:text-obsidian"
        >
          Skip to content
        </a>
        {children}
      {/* tame-website-intelligence:start */}
<link rel="stylesheet" href={`${analyticsBasePath}/visitor-privacy.css?v=1b801fc364d8`} />
<WebsiteAnalyticsScript src={`${analyticsBasePath}/visitor-privacy.js?v=1b801fc364d8`} data-website-id="cd790d4e-ef78-46b8-b5d5-126598be31a0" data-domains="newphase-coaching.com,www.newphase-coaching.com" data-paths={analyticsPaths} data-preferences-paths={`${analyticsBasePath}/privacy-analytics.html`} data-privacy-url={`${analyticsBasePath}/privacy-analytics.html`} data-basic-count="true" data-default-analytics="australia" data-track-navigation="true" data-preference-scope="site" strategy="afterInteractive" />
<WebsiteAnalyticsScript src={`${analyticsBasePath}/tame-analytics-events.js?v=32c576282361`} strategy="afterInteractive" />
{/* tame-website-intelligence:end */}
</body>
    </html>
  );
}
