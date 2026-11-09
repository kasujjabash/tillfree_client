import { cn } from "@/lib/utils";

export function AuthPanel({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="rounded-xl border bg-surface p-6 shadow-xs sm:p-8">
        <h1 className="text-page-title">{title}</h1>
        {description && <p className="mt-1.5 text-body text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-body text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function FormAlert({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "info" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-body",
        tone === "danger" && "border-destructive/20 bg-destructive-subtle text-destructive",
        tone === "info" && "border-primary/15 bg-primary-subtle text-foreground",
        tone === "warning" && "border-warning/25 bg-warning-subtle text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
