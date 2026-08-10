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
    // English
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
    // Hindi / Hinglish
    "lamination machine kharidna",
    "paper cutting machine India",
    "hot foil stamping machine price",
    "binding machine kharidna",
    "packaging machine India",
    "printing machine supplier India",
    "औद्योगिक मशीन सप्लायर",
    "लेमिनेशन मशीन भारत",
    "पेपर कटर मशीन",
    "बाइंडिंग मशीन खरीदना",
    "foil stamping machine India buy",
    "die cutting machine buy online India",
    "industrial machinery supplier Kolkata",
    "TMS India machines",
    "Tara Maa Solutions Kolkata",
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

  const logoAbsoluteUrl = logoUrl
    ? (logoUrl.startsWith("http") ? logoUrl : `https://tmsolutionsindia.com${logoUrl}`)
    : "https://tmsolutionsindia.com/logo.png";

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Organization"],
    name: "Tara Maa Solutions",
    alternateName: "TM Solutions India",
    url: "https://tmsolutionsindia.com",
    logo: {
      "@type": "ImageObject",
      url: logoAbsoluteUrl,
      width: 200,
      height: 60,
    },
    image: logoAbsoluteUrl,
    telephone: contactPhone ?? "+91-75950 56476",
    email: contactEmail ?? "support.tmsindia@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kolkata",
      addressRegion: "West Bengal",
      addressCountry: "IN",
    },
    description: "Tara Maa Solutions — भारत के भरोसेमंद B2B औद्योगिक उपकरण सप्लायर। Lamination machines, paper cutters, binding, die-cutting, hot foil stamping. Pan-India delivery.",
    knowsLanguage: ["en", "hi"],
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    sameAs: [
      "https://wa.me/917595056476",
      "https://www.tmsolutionsindia.com",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Industrial Print Finishing & Packaging Machines",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lamination Machines" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Paper Cutting Machines" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Hot Foil Stamping Machines" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Perfect Binding Machines" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Die Cutting Machines" } },
      ],
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Explicit favicon links help Google and other crawlers find the icon immediately */}
        <link rel="icon" href="/icon" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon" sizes="180x180" />
        <link rel="shortcut icon" href="/icon" />
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
