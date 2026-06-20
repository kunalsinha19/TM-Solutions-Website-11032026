import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";

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

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="relative z-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
