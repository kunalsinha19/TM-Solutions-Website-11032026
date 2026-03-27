import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

export default function AboutSection() {
  return (
    <section className="section-block about-section">
      <div className="container about-grid">
        <AnimatedReveal>
          <SectionHeading
            eyebrow="About us"
            title="A modern B2B platform for industrial printing, finishing, and office automation."
            description="Tara Maa Solutions helps businesses discover, compare, and source reliable equipment, consumables, and workflow tools with clarity and confidence."
          />
          <div className="about-intro">
            <p>
              We believe the future of industrial procurement is digital, transparent, and data-driven. Our platform blends technology,
              industry expertise, and guided quote workflows so teams can make smarter buying decisions and modernize production environments.
            </p>
          </div>
        </AnimatedReveal>
        <AnimatedReveal delay={0.1} className="about-panel">
          <div className="about-copy">
            <p>
              Beyond product listings, we aim to be a knowledge and innovation hub for the printing and finishing industry by offering
              insights, analytics, and structured guidance that reduce guesswork and improve outcomes.
            </p>
            <p>
              We curate dependable machines, lamination systems, finishing equipment, sublimation tools, office automation products,
              and industrial consumables from trusted manufacturers and suppliers. The goal is simple: make procurement clear,
              faster, and more predictable for every business.
            </p>
            <div className="about-mission">
              <div>
                <p className="eyebrow">Vision</p>
                <p>
                  To become a trusted global platform for industrial printing, finishing, and automation solutions, enabling businesses
                  to grow through innovation, accessibility, and data-driven procurement.
                </p>
              </div>
              <div>
                <p className="eyebrow">Mission</p>
                <ul>
                  <li>Simplify the procurement of industrial equipment and consumables.</li>
                  <li>Connect manufacturers, distributors, and businesses through one unified marketplace.</li>
                  <li>Provide technology-driven tools and analytics for smarter operational decisions.</li>
                  <li>Build a reliable, transparent ecosystem for the printing and finishing industry.</li>
                </ul>
              </div>
            </div>
            <div className="about-offer">
              <p className="eyebrow">What we offer</p>
              <ul>
                <li>Industrial printing and finishing equipment</li>
                <li>Lamination and binding solutions</li>
                <li>Office automation tools</li>
                <li>Sublimation and custom printing equipment</li>
                <li>Industrial consumables</li>
                <li>Workflow and procurement support</li>
              </ul>
            </div>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
