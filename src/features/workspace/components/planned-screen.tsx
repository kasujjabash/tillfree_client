"use client";

import { Compass, Hammer, Lock } from "lucide-react";
import Link from "next/link";

import { Page, PageHeader } from "@/components/layout/page";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { canSee, findNavItem } from "@/config/navigation";
import { useWorkspace } from "../workspace-provider";

/**
 * Resolves any workspace path that has no dedicated page yet:
 *  - a registered, permitted destination → "not built yet" (keeps the IA reviewable)
 *  - registered but not permitted/entitled → restricted
 *  - unknown → not found
 */
export function PlannedScreen({ path }: { path: string }) {
  const { permissions, modules, href } = useWorkspace();
  const item = findNavItem(path);

  if (!item) {
    return (
      <EmptyState
        size="page"
        icon={Compass}
        title="Page not found"
        description="This address doesn't match anything in this workspace."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={href("overview")}>Go to overview</Link>
          </Button>
        }
      />
    );
  }

  if (!canSee(item, { permissions, modules })) {
    const reason = item.module && !modules.has(item.module) ? "module" : "permission";
    return (
      <EmptyState
        size="page"
        icon={Lock}
        title={reason === "module" ? `${item.label} isn't enabled` : `You don't have access to ${item.label}`}
        description={
          reason === "module"
            ? "This module isn't part of your organisation's plan. An owner can enable it from Modules."
            : "Ask an administrator for a role that includes it."
        }
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={href("overview")}>Go to overview</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Page>
      <PageHeader title={item.label} />
      <div className="rounded-xl border border-dashed">
        <EmptyState
          icon={Hammer}
          title="Not built yet"
          description={`${item.label} is part of the navigation so the structure can be reviewed. Its screens come in a later phase, once the API and workflows are agreed.`}
        />
      </div>
    </Page>
  );
}
