"use client";

import { Check, ChevronsUpDown, LayoutList } from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useMyMemberships } from "@/features/organisations/api";
import { OrganisationAvatar } from "@/features/organisations/components/organisation-avatar";
import { useWorkspace } from "@/features/workspace/workspace-provider";

/**
 * Brand mark + organisation switcher. Switching is a navigation to the other
 * organisation's URL; WorkspaceProvider then evicts the previous tenant's cache.
 */
export function OrganisationSwitcher() {
  const { organisation, roles } = useWorkspace();
  const { data: memberships } = useMyMemberships();
  const others = memberships?.filter((m) => m.status === "active") ?? [];

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-1">
        <Link
          href={`/${organisation.slug}/overview`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md group-data-[collapsible=icon]:hidden"
          aria-label="Unified OS — go to overview"
        >
          <LogoMark className="size-5" />
        </Link>
        <span aria-hidden className="text-border-strong group-data-[collapsible=icon]:hidden">
          /
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="min-w-0 flex-1 gap-2 px-1.5 data-[state=open]:bg-sidebar-accent"
              aria-label={`Current organisation: ${organisation.name}. Switch organisation`}
            >
              <OrganisationAvatar id={organisation.id} name={organisation.name} size="sm" />
              <span className="truncate font-medium text-foreground">{organisation.name}</span>
              <ChevronsUpDown className="ml-auto size-3.5! text-muted-foreground" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start" sideOffset={6}>
            <DropdownMenuLabel className="text-meta font-normal text-muted-foreground">
              Your organisations
            </DropdownMenuLabel>
            {others.map((m) => {
              const current = m.organisation.id === organisation.id;
              return (
                <DropdownMenuItem key={m.id} asChild className="gap-2.5 py-1.5">
                  <Link href={`/${m.organisation.slug}/overview`} aria-current={current ? "true" : undefined}>
                    <OrganisationAvatar id={m.organisation.id} name={m.organisation.name} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{m.organisation.name}</span>
                      <span className="block truncate text-meta text-muted-foreground">
                        {current ? roles.map((r) => r.name).join(", ") : m.roles.map((r) => r.name).join(", ")}
                      </span>
                    </span>
                    {current && <Check className="text-primary" aria-hidden />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/select-organisation?switch=1">
                <LayoutList aria-hidden />
                All organisations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
