import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

const fallbackContent = {
  aboutTitle: "A modern B2B platform for industrial printing, finishing, and office automation.",
  aboutDescription: "Tara Maa Solutions is a digital-first B2B platform powering the next era of industrial procurement.",
  aboutIntro: "We drive digital transformation across printing, finishing, and automation by combining AI-assisted discovery, smart sourcing, and workflow intelligence. Our platform connects manufacturers, distributors, and enterprises into a unified marketplace that learns from data and improves decisions in real time.",
  aboutParagraphs: [
    "Automation, predictive insights, and guided procurement journeys reduce downtime, standardize vendor choices, and help teams scale with confidence. From intelligent recommendations to structured approvals, every interaction is designed to be transparent, fast, and measurable.",
    "Built for global growth, we deliver secure, scalable infrastructure that modernizes production environments, connects supply chains, and keeps operations future-ready as new technologies emerge."
  ],
  visionTitle: "Vision",
  visionDescription: "To become the global, AI-powered operating system for industrial procurement and production modernization.",
  missionTitle: "Mission",
  missionItems: [
    "Accelerate digital transformation with intelligent, automation-first procurement workflows.",
    "Connect manufacturers, distributors, and enterprises through a single, data-driven marketplace.",
    "Deliver smart insights that improve cost, speed, and operational performance at scale.",
    "Build a future-ready ecosystem that evolves with emerging industrial technologies."
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
