"use client";

import { ChevronRight, CircleCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_NAV_ITEMS, canSee } from "@/config/navigation";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { formatRelative } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { AttentionItem, Severity } from "../types";

const severityLabel: Record<Severity, string> = { high: "Urgent", medium: "Soon", low: "When you can" };

export function AttentionList({ items, loading }: { items: AttentionItem[] | undefined; loading: boolean }) {
  const { href, format, permissions, modules } = useWorkspace();

  if (loading) {
    return (
      <div className="divide-y rounded-xl border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 px-4 py-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="rounded-xl border">
        <EmptyState icon={CircleCheck} title="Nothing needs attention" description="Overdue, low-stock and approval items appear here." />
      </div>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border">
      {items.map((item) => {
        const target = item.target ? ALL_NAV_ITEMS.find((n) => n.id === item.target) : undefined;
        const reachable = target && canSee(target, { permissions, modules });
        const inner = (
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-[7px] size-1.5 shrink-0 rounded-full",
                item.severity === "high" && "bg-destructive",
                item.severity === "medium" && "bg-warning",
                item.severity === "low" && "bg-muted-foreground/50",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-body">
                <span className="sr-only">{severityLabel[item.severity]}: </span>
                {item.title}
              </p>
              <p className="mt-0.5 truncate text-meta text-muted-foreground">
                {item.detail}
                {item.due_at && <> · due {formatRelative(item.due_at, format)}</>}
              </p>
            </div>
            {reachable && <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
          </div>
        );
        return (
          <li key={item.id}>
            {reachable ? (
              <Link href={href(target.path)} className="block transition-colors hover:bg-accent focus-visible:bg-accent">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
