import AnimatedReveal from "./AnimatedReveal";
import ProductRoulette from "./ProductRoulette";
import SectionHeading from "./SectionHeading";

const categories = [
  {
    title: "Process Equipment",
    description: "Industrial products for plant operations, flow management, and process continuity."
  },
  {
    title: "Automation Systems",
    description: "Controls, monitoring components, and smarter infrastructure for modern facilities."
  },
  {
    title: "Electrical Solutions",
    description: "Reliable components and systems for power distribution and industrial installations."
  },
  {
    title: "Custom Supply Kits",
    description: "Tailored combinations of products matched to project and procurement requirements."
  }
];

export default function CategoriesSection() {
  return (
    <section id="categories" className="section-block">
      <div className="container">
        <SectionHeading
          eyebrow="Product categories"
          title="Clear category structure for buyers who need to move quickly."
          description="Each category can lead into SEO landing pages, product grids, and quote flows."
        />
        <AnimatedReveal className="roulette-section" delay={0.05}>
          <div className="roulette-copy">
            <p className="eyebrow">Product display</p>
            <h3>Hover the left or right side to drive the product wheel.</h3>
            <p className="section-description">
              Left hover rotates upward, right hover rotates downward, with smooth motion and mechanical tick feedback.
            </p>
          </div>
          <ProductRoulette />
        </AnimatedReveal>
        <div className="category-grid">
          {categories.map((category, index) => (
            <AnimatedReveal key={category.title} delay={index * 0.07} className="category-card">
              <div className="category-index">0{index + 1}</div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
