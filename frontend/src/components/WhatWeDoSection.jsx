import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

const fallbackServices = [
  {
    title: "Easy product search",
    description: "Find products by category and quickly understand what they are used for."
  },
  {
    title: "Helpful guidance",
    description: "If you are not sure which product fits your need, we help you choose the right option."
  },
  {
    title: "Quick quote support",
    description: "Send your requirement and our team will get back to you with the next steps."
  }
];

export default function WhatWeDoSection({ content }) {
  const title = content?.whatWeDoTitle || "We make industrial buying simpler for your business.";
  const description = content?.whatWeDoDescription || "You do not need to search through confusing technical pages. We show products clearly and help you reach the right team quickly.";
  const services = Array.isArray(content?.whatWeDoItems) && content.whatWeDoItems.length
    ? content.whatWeDoItems
    : fallbackServices;

  return (
    <section className="section-block section-soft">
      <div className="container">
        <SectionHeading
          eyebrow="What we do"
          title={title}
          description={description}
        />
        <div className="feature-grid">
          {services.map((service, index) => (
            <AnimatedReveal key={`${service.title}-${index}`} delay={index * 0.08} className="feature-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
