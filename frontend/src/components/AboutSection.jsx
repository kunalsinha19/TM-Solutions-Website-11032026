import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

export default function AboutSection() {
  return (
    <section className="section-block about-section">
      <div className="container about-grid">
        <AnimatedReveal>
          <SectionHeading
            eyebrow="About us"
            title="A business-focused product company with a strong digital front door."
            description="Tara Maa Solutions is positioned to serve industrial and enterprise buyers with responsive service, structured product communication, and dependable lead handling."
          />
        </AnimatedReveal>
        <AnimatedReveal delay={0.1} className="about-panel">
          <ul>
            <li>Built to support scalable B2B inquiries</li>
            <li>Designed for SEO landing pages and product visibility</li>
            <li>Responsive across desktop, tablet, and mobile</li>
            <li>Optimized for quote collection and follow-up</li>
          </ul>
        </AnimatedReveal>
      </div>
    </section>
  );
}
