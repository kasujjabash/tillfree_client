"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_NAV_ITEMS } from "@/config/navigation";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { formatRelative } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { CursorPage } from "@/types/api";
import type { AppNotification } from "../types";

export function NotificationsMenu() {
  const { organisation, format, href } = useWorkspace();
  const query = useQuery({
    queryKey: queryKeys.org(organisation.id).notifications.all,
    queryFn: ({ signal }) =>
      apiRequest<CursorPage<AppNotification>>("/notifications/", { organisationId: organisation.id, signal }),
    refetchInterval: 60_000,
  });
  const items = query.data?.results ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-surface" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-label">Notifications</p>
          {unread > 0 && <span className="text-meta text-muted-foreground">{unread} unread</span>}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {query.isPending && (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
          {query.isSuccess && items.length === 0 && (
            <EmptyState icon={BellOff} title="You're all caught up" description="New activity for this organisation appears here." />
          )}
          {items.length > 0 && (
            <ul className="divide-y">
              {items.map((n) => {
                const target = n.target ? ALL_NAV_ITEMS.find((i) => i.id === n.target) : null;
                const body = (
                  <div className="flex gap-3 px-4 py-3">
                    <span
                      className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-body", n.read_at ? "text-muted-foreground" : "text-foreground")}>
                        {!n.read_at && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-meta text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-meta text-muted-foreground">{formatRelative(n.created_at, format)}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {target ? (
                      <Link href={href(target.path)} className="block hover:bg-accent focus-visible:bg-accent">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
