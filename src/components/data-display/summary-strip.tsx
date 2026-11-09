import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A single bordered strip of key figures, instead of a row of floating cards.
 * Each cell answers one operational question and links to where it is acted on.
 */
export function SummaryStrip({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <section aria-label={label} className={cn("overflow-hidden rounded-xl border bg-surface", className)}>
      {/* 1px gaps over a border-coloured background draw the dividers for any number of cells. */}
      <dl className="grid grid-cols-2 gap-px bg-border lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none [&>*]:bg-surface [&>*:last-child:nth-child(odd)]:max-lg:col-span-2">
        {children}
      </dl>
    </section>
  );
}

export function SummaryItem({
  label,
  value,
  detail,
  href,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  href?: string;
  loading?: boolean;
}) {
  const content = (
    <>
      <dt className="text-meta text-muted-foreground">{label}</dt>
      <dd className="mt-1.5" data-numeric>
        {loading ? (
          <span className="block h-6 w-28 animate-pulse rounded bg-muted" />
        ) : (
          <span className="block truncate text-[18px] leading-6 font-semibold tracking-[-0.01em]">{value}</span>
        )}
      </dd>
      {detail && !loading && <dd className="mt-1 truncate text-meta text-muted-foreground">{detail}</dd>}
    </>
  );
  return href && !loading ? (
    <Link href={href} className="block min-w-0 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent">
      {content}
    </Link>
  ) : (
    <div className="min-w-0 px-4 py-3.5">{content}</div>
  );
}
