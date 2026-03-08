import { apiClient } from "../../../../lib/api-client";
import { SectionRenderer } from "../../../../components/seo-builder/section-renderer";

export default async function SeoLandingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await apiClient.getSeoPage(slug);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16">
      {page.sections.map((section, index) => (
        <SectionRenderer key={`${section.type}-${index}`} section={section} />
      ))}
    </div>
  );
}
