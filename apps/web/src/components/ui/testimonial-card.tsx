interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
}

export function TestimonialCard({ quote, author, role, company, initials }: TestimonialCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-panel p-7 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-amber-400">
            <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z"/>
          </svg>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted">"{quote}"</p>
      <div className="flex items-center gap-3 border-t border-border/60 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold">{author}</p>
          <p className="text-xs text-muted">{role}, {company}</p>
        </div>
      </div>
    </div>
  );
}
