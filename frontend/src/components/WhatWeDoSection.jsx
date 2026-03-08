import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

const services = [
  {
    title: "Catalog-driven discovery",
    description: "Organized product presentation that helps procurement and operations teams compare fit fast."
  },
  {
    title: "Technical consultation",
    description: "We translate requirements into product recommendations with practical, business-ready guidance."
  },
  {
    title: "Quote acceleration",
    description: "A direct inquiry funnel that captures intent, validates leads, and reduces back-and-forth."
  }
];

export default function WhatWeDoSection() {
  return (
    <section className="section-block section-soft">
      <div className="container">
        <SectionHeading
          eyebrow="What we do"
          title="We connect product expertise with a faster digital sales process."
          description="The website is built to educate, segment, and convert B2B buyers without overwhelming them."
        />
        <div className="feature-grid">
          {services.map((service, index) => (
            <AnimatedReveal key={service.title} delay={index * 0.08} className="feature-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
