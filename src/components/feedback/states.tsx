import { AlertCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { describeError, isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/**
 * Empty, error and restricted states. Each one says what happened and offers
 * the next useful action. No illustrations: an icon, a sentence, a button.
 */

interface StateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** "inline" sits inside a table or panel; "page" centres in the content area. */
  size?: "inline" | "page";
}

export function EmptyState({ icon: Icon, title, description, action, className, size = "inline" }: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        size === "page" ? "min-h-[50vh] py-16" : "py-12",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border bg-surface text-muted-foreground shadow-xs">
          <Icon className="size-4" aria-hidden />
        </div>
      )}
      <p className="text-label text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-body text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
  size = "inline",
  title = "This couldn't be loaded",
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  size?: "inline" | "page";
  title?: string;
}) {
  const requestId = isApiError(error) ? error.requestId : undefined;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        size === "page" ? "min-h-[50vh] py-16" : "py-12",
        className,
      )}
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-destructive/20 bg-destructive-subtle text-destructive">
        <AlertCircle className="size-4" aria-hidden />
      </div>
      <p className="text-label">{title}</p>
      <p className="mt-1 max-w-sm text-body text-muted-foreground">{describeError(error)}</p>
      {requestId && (
        <p className="mt-2 text-meta text-muted-foreground">
          Reference <span className="font-mono">{requestId.slice(0, 8)}</span>
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
