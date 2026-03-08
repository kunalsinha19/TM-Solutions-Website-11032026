import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";

export const metadata: Metadata = {
  title: "Tara Maa Solutions",
  description: "B2B product catalog and lead generation platform."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
