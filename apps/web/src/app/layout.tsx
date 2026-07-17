import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";
import { ScrollToTop } from "../components/layout/scroll-to-top";
import { apiClient } from "../lib/api-client";
import VisitorTracker from "../components/analytics/VisitorTracker";
import ChatWidget from "../components/chat/ChatWidget";

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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <VisitorTracker />
        <ScrollToTop />
        <SiteHeader logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} />
        <main className="relative z-10">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
