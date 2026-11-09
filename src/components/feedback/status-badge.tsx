import { cn } from "@/lib/utils";

/**
 * Status is always text plus a small dot, never colour alone (WCAG 1.4.1).
 * Tones map to meaning: success = done/healthy, warning = needs attention soon,
 * danger = blocked/failed, info = in progress, neutral = everything else.
 */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<StatusTone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground/60" },
  info: { badge: "bg-info-subtle text-info", dot: "bg-info" },
  success: { badge: "bg-success-subtle text-success", dot: "bg-success" },
  warning: { badge: "bg-warning-subtle text-warning", dot: "bg-warning" },
  danger: { badge: "bg-destructive-subtle text-destructive", dot: "bg-destructive" },
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-meta font-medium whitespace-nowrap",
        t.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} aria-hidden />
      {children}
    </span>
  );
}

/** Quiet inline status for dense lists: dot + plain text, no background. */
export function StatusDot({ tone = "neutral", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn("size-1.5 shrink-0 rounded-full", toneClasses[tone].dot)} aria-hidden />
      {children}
    </span>
  );
}
