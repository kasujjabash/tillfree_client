"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  ALL_NAV_ITEMS,
  canSee,
  findNavItem,
  NAV_ITEMS,
  type NavItem,
  type NavSection,
  SECTION_INDUSTRY,
  SECTION_ORDER,
  SETTINGS_ITEM,
} from "@/config/navigation";
import { useWorkspace } from "@/features/workspace/workspace-provider";

/** Navigation filtered by this member's modules and permissions. */
export function useVisibleNavigation() {
  const { permissions, modules, organisation } = useWorkspace();

  return useMemo(() => {
    const access = { permissions, modules };
    const groups: { section: NavSection; items: NavItem[] }[] = [];
    for (const section of SECTION_ORDER) {
      const industry = SECTION_INDUSTRY[section];
      if (industry && !organisation.industries.includes(industry)) continue;
      const items = NAV_ITEMS.filter((i) => i.section === section && canSee(i, access));
      if (items.length) groups.push({ section, items });
    }
    const settings = canSee(SETTINGS_ITEM, access) ? SETTINGS_ITEM : null;
    const all = ALL_NAV_ITEMS.filter((i) => canSee(i, access));
    return { groups, settings, all };
  }, [permissions, modules, organisation.industries]);
}

/** The nav item for the current URL, and the path below the organisation slug. */
export function useCurrentNavItem() {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");
  return { item: findNavItem(rest), rest };
}
