"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";

import { BranchSwitcher } from "@/components/navigation/branch-switcher";
import { CommandMenu } from "@/components/navigation/command-menu";
import { HelpMenu } from "@/components/navigation/help-menu";
import { useCurrentNavItem } from "@/components/navigation/use-visible-navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isMockMode } from "@/config/env";
import { SECTION_LABELS } from "@/config/navigation";
import { NotificationsMenu } from "@/features/notifications/components/notifications-menu";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export function TopBar() {
  const { item } = useCurrentNavItem();
  const { href } = useWorkspace();
  const showSection = item && item.section !== "workspace";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap text-label font-normal">
          {showSection && (
            <>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <span className="text-muted-foreground">{SECTION_LABELS[item.section]}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            {item ? (
              <BreadcrumbPage className="truncate font-medium">{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={href("overview")}>Overview</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex shrink-0 items-center gap-1">
        {isMockMode && <SampleDataBadge />}
        <BranchSwitcher />
        <CommandMenu />
        <HelpMenu />
        <NotificationsMenu />
      </div>
    </header>
  );
}

function SampleDataBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="mr-1 hidden items-center gap-1.5 rounded-md border border-dashed border-warning/40 bg-warning-subtle px-1.5 py-0.5 text-meta font-medium text-warning lg:inline-flex"
        >
          <FlaskConical className="size-3" aria-hidden />
          Sample data
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        Everything shown is fictional sample data from the client&apos;s mock API. Set NEXT_PUBLIC_API_MODE=live to use
        the Django API.
      </TooltipContent>
    </Tooltip>
  );
}
