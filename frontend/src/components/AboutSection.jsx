import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

const fallbackContent = {
  aboutTitle: "A modern B2B platform for industrial printing, finishing, and office automation.",
  aboutDescription: "Tara Maa Solutions helps businesses discover, compare, and source reliable equipment, consumables, and workflow tools with clarity and confidence.",
  aboutIntro: "We believe the future of industrial procurement is digital, transparent, and data-driven. Our platform blends technology, industry expertise, and guided quote workflows so teams can make smarter buying decisions and modernize production environments.",
  aboutParagraphs: [
    "Beyond product listings, we aim to be a knowledge and innovation hub for the printing and finishing industry by offering insights, analytics, and structured guidance that reduce guesswork and improve outcomes.",
    "We curate dependable machines, lamination systems, finishing equipment, sublimation tools, office automation products, and industrial consumables from trusted manufacturers and suppliers. The goal is simple: make procurement clear, faster, and more predictable for every business."
  ],
  visionTitle: "Vision",
  visionDescription: "To become a trusted global platform for industrial printing, finishing, and automation solutions, enabling businesses to grow through innovation, accessibility, and data-driven procurement.",
  missionTitle: "Mission",
  missionItems: [
    "Simplify the procurement of industrial equipment and consumables.",
    "Connect manufacturers, distributors, and businesses through one unified marketplace.",
    "Provide technology-driven tools and analytics for smarter operational decisions.",
    "Build a reliable, transparent ecosystem for the printing and finishing industry."
  ],
  offerTitle: "What we offer",
  offerItems: [
    "Industrial printing and finishing equipment",
    "Lamination and binding solutions",
    "Office automation tools",
    "Sublimation and custom printing equipment",
    "Industrial consumables",
    "Workflow and procurement support"
  ]
};

export default function AboutSection({ content }) {
  const data = { ...fallbackContent, ...(content || {}) };
  const paragraphs = Array.isArray(data.aboutParagraphs) && data.aboutParagraphs.length
    ? data.aboutParagraphs
    : fallbackContent.aboutParagraphs;
  const missionItems = Array.isArray(data.missionItems) && data.missionItems.length
    ? data.missionItems
    : fallbackContent.missionItems;
  const offerItems = Array.isArray(data.offerItems) && data.offerItems.length
    ? data.offerItems
    : fallbackContent.offerItems;

  return (
    <section className="section-block about-section">
      <div className="container about-grid">
        <AnimatedReveal>
          <SectionHeading
            eyebrow="About us"
            title={data.aboutTitle}
            description={data.aboutDescription}
          />
          <div className="about-intro">
            <p>{data.aboutIntro}</p>
          </div>
        </AnimatedReveal>
        <AnimatedReveal delay={0.1} className="about-panel">
          {data.aboutImageUrl ? (
            <div className="about-image">
              <img src={data.aboutImageUrl} alt="About Tara Maa Solutions" />
            </div>
          ) : null}
          <div className="about-copy">
            {paragraphs.map((paragraph, index) => (
              <p key={`about-paragraph-${index}`}>{paragraph}</p>
            ))}
            <div className="about-mission">
              <div>
                <p className="eyebrow">{data.visionTitle || "Vision"}</p>
                <p>{data.visionDescription}</p>
              </div>
              <div>
                <p className="eyebrow">{data.missionTitle || "Mission"}</p>
                <ul>
                  {missionItems.map((item, index) => (
                    <li key={`mission-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="about-offer">
              <p className="eyebrow">{data.offerTitle || "What we offer"}</p>
              <ul>
                {offerItems.map((item, index) => (
                  <li key={`offer-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
