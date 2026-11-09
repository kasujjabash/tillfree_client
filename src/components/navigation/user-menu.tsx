"use client";

import { ArrowLeftRight, ChevronsUpDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth, useCurrentUser } from "@/features/authentication/auth-provider";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { initials } from "@/lib/formatting";

export function UserMenu() {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const { roles, href } = useWorkspace();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-11 gap-2.5 px-2 data-[state=open]:bg-sidebar-accent" aria-label="Account menu">
              <Avatar className="size-7 rounded-full">
                <AvatarFallback className="bg-secondary text-[11px] font-medium text-secondary-foreground">
                  {initials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-label text-foreground">{user.full_name}</span>
                <span className="truncate text-meta text-muted-foreground">{roles.map((r) => r.name).join(", ")}</span>
              </span>
              <ChevronsUpDown className="ml-auto size-3.5! text-muted-foreground" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" side={isMobile ? "top" : "right"} align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-label">{user.full_name}</p>
              <p className="truncate text-meta text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={href("account/profile")}>
                  <UserRound aria-hidden />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={href("account/security")}>
                  <ShieldCheck aria-hidden />
                  Sign-in &amp; security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/select-organisation?switch=1">
                  <ArrowLeftRight aria-hidden />
                  Switch organisation
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
