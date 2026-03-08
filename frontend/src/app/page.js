import HeroSection from "../components/HeroSection";
import WhatWeDoSection from "../components/WhatWeDoSection";
import CategoriesSection from "../components/CategoriesSection";
import AboutSection from "../components/AboutSection";
import QuoteSection from "../components/QuoteSection";
import SiteFooter from "../components/SiteFooter";
import {
  buildMetadata,
  buildOrganizationSchema,
  buildWebsiteSchema
} from "../lib/seo";

export const metadata = buildMetadata({
  title: "Industrial Products and Quote-Driven B2B Website",
  description: "Explore Tara Maa Solutions for industrial products, category-based discovery, and fast B2B quote submission.",
  path: "/"
});

export default function HomePage() {
  const structuredData = [buildOrganizationSchema(), buildWebsiteSchema()];

  return (
    <>
      {structuredData.map((entry, index) => (
        <script
          key={`ld-json-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      <main id="top">
        <HeroSection />
        <WhatWeDoSection />
        <CategoriesSection />
        <AboutSection />
        <QuoteSection />
        <SiteFooter />
      </main>
    </>
  );
}
