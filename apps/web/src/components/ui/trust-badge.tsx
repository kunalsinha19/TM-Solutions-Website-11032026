interface TrustBadgeProps {
  icon: string;
  label: string;
}

export function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-panel/80 px-4 py-2 text-xs font-medium text-muted shadow-card backdrop-blur-sm">
      <span className="text-base">{icon}</span>
      {label}
    </div>
  );
}
