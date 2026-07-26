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
  metadataBase: new URL("https://tmsolutionsindia.com"),
  title: {
    default: "TM Solutions India — Print Finishing & Packaging Machines | Lamination, Binding, Die-Cutting",
    template: "%s | TM Solutions India",
  },
  description:
    "India's trusted supplier of print finishing machines — lamination machines, perfect binding, die-cutting, hot foil stamping, paper cutters & folding machines. Pan-India delivery. Free consultation. Get a quote today.",
  keywords: [
    "print finishing machines India",
    "lamination machine India",
    "perfect binding machine India",
    "die cutting machine India",
    "hot foil stamping machine",
    "paper cutter machine India",
    "folding machine India",
    "packaging machines India",
    "B2B printing equipment",
    "TM Solutions India",
    "Tara Maa Solutions",
    "buy printing machine India",
    "commercial laminator India",
    "book binding machine India",
    "roll laminator India",
    "print shop equipment",
    "guillotine paper cutter",
    "thermal lamination machine",
    "creasing scoring machine India",
    "print finishing equipment supplier",
  ],
  openGraph: {
    siteName: "TM Solutions India",
    type: "website",
    url: "https://tmsolutionsindia.com",
    title: "TM Solutions India — Print Finishing & Packaging Machines",
    description:
      "India's trusted supplier of lamination machines, perfect binding, die-cutting, hot foil stamping, paper cutters & packaging equipment. Pan-India delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TM Solutions India — Print Finishing & Packaging Machines",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TM Solutions India — Print Finishing & Packaging Machines",
    description:
      "Lamination, binding, die-cutting, hot foil stamping, paper cutters & more. Pan-India delivery. Free consultation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://tmsolutionsindia.com",
  },
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
    sameAs: ["https://wa.me/917595056476"],
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
