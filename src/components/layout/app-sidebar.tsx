"use client";

import Link from "next/link";

import { OrganisationSwitcher } from "@/components/navigation/organisation-switcher";
import { useCurrentNavItem, useVisibleNavigation } from "@/components/navigation/use-visible-navigation";
import { UserMenu } from "@/components/navigation/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { type NavItem, SECTION_LABELS } from "@/config/navigation";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export function AppSidebar() {
  const { groups, settings } = useVisibleNavigation();
  const { item: current } = useCurrentNavItem();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="pt-3">
        <OrganisationSwitcher />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {groups.map(({ section, items }) => (
          <SidebarGroup key={section} className="py-1.5">
            {section !== "workspace" && (
              <SidebarGroupLabel className="h-7 text-overline text-muted-foreground/90">
                {SECTION_LABELS[section]}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-px">
                {items.map((item) => (
                  <NavLink key={item.id} item={item} active={current?.id === item.id} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 pb-3">
        {settings && (
          <SidebarMenu>
            <NavLink item={settings} active={current?.id === settings.id} />
          </SidebarMenu>
        )}
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href } = useWorkspace();
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className="h-7.5 gap-2.5 text-[13px] text-sidebar-foreground data-[active=true]:text-foreground [&_svg]:text-muted-foreground data-[active=true]:[&_svg]:text-foreground"
      >
        <Link
          href={href(item.path)}
          aria-current={active ? "page" : undefined}
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Icon aria-hidden />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
