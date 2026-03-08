import type { SeoSection } from "@tara-maa/shared-types";

export function SectionRenderer({ section }: { section: SeoSection }) {
  switch (section.type) {
    case "hero":
      return (
        <section className="rounded-[2rem] bg-panel p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">SEO Landing Page</p>
          <h1 className="mt-4 text-4xl font-semibold">{section.heading}</h1>
          <p className="mt-4 max-w-2xl text-muted">{section.subheading}</p>
        </section>
      );
    case "feature-grid":
      return (
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-border bg-panel p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case "stats":
      return (
        <section className="rounded-[2rem] border border-border bg-panel p-8">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {section.items.map((item) => (
              <div key={item.label}>
                <p className="text-3xl font-semibold text-accent">{item.value}</p>
                <p className="text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "cta-banner":
      return (
        <section className="rounded-[2rem] bg-accent px-8 py-10 text-white">
          <h2 className="text-3xl font-semibold">{section.title}</h2>
          <p className="mt-3 max-w-xl text-white/80">{section.description}</p>
          <a href={section.ctaHref} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-accent">
            {section.ctaLabel}
          </a>
        </section>
      );
    case "faq":
      return (
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          {section.items.map((item) => (
            <article key={item.question} className="rounded-[1.5rem] border border-border bg-panel p-5">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted">{item.answer}</p>
            </article>
          ))}
        </section>
      );
    case "rich-text":
      return (
        <section className="rounded-[2rem] border border-border bg-panel p-8">
          {section.title ? <h2 className="text-2xl font-semibold">{section.title}</h2> : null}
          <p className="mt-4 whitespace-pre-line text-muted">{section.content}</p>
        </section>
      );
    default:
      return null;
  }
}
