import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";
import { ScrollToTop } from "../components/layout/scroll-to-top";
import { apiClient } from "../lib/api-client";
import VisitorTracker from "../components/analytics/VisitorTracker";
import AvatarAssistant from "../components/chat/AvatarAssistant";

export const metadata: Metadata = {
  title: {
    default: "TM Solutions — Industrial B2B Products & Equipment",
    template: "%s | TM Solutions"
  },
  description: "Premium industrial products, smart automation solutions, and fast quote turnaround for enterprise buyers. Trusted by 200+ companies.",
  openGraph: {
    siteName: "TM Solutions",
    type: "website"
  }
};

// Runs synchronously before first paint — eliminates the light-mode flash on dark/green preference.
const themeScript = `(function(){try{var t=localStorage.getItem('tara-maa-theme');if(t==='dark'||t==='green'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const { logoUrl, contactEmail, contactPhone } = await apiClient.getSiteHeaderData();

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TM Solutions",
    url: "https://tmsolutionsindia.com",
    telephone: contactPhone ?? "+91-9876543210",
    email: contactEmail ?? "taramaasolutions2025@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    description: "Premium industrial products, smart automation solutions, and fast quote turnaround for enterprise buyers. Trusted by 200+ companies across India.",
    sameAs: ["https://wa.me/919876543210"],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Script
          id="local-business-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <VisitorTracker />
        <ScrollToTop />
        <SiteHeader logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} />
        <main className="relative z-10">{children}</main>
        <SiteFooter />
        <AvatarAssistant />
      </body>
    </html>
  );
}
