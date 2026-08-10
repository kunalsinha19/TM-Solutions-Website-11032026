import Link from "next/link";

interface TrustBadgeProps {
  icon: string;
  label: string;
  /** When provided the badge renders as a navigable link. */
  href?: string;
}

const CLS =
  "flex items-center gap-2 rounded-full border border-border/80 bg-panel/80 px-4 py-2 text-xs font-medium text-muted shadow-card backdrop-blur-sm transition-colors duration-150";

export function TrustBadge({ icon, label, href }: TrustBadgeProps) {
  const inner = (
    <>
      <span className="text-base">{icon}</span>
      {label}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${CLS} hover:border-accent/50 hover:text-accent hover:bg-accent/5`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={CLS}>{inner}</div>;
}
